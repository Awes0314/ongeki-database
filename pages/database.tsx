import React, { useState, useRef } from "react";
import Title from "@/components/Title";
import Header from "@/components/Header";

const LEVELS = [
  "15+", "15", "14+", "14", "13+", "13", "12+", "12", "11+", "11", "10+", "10",
  "9+", "9", "8+", "8", "7+", "7", "6", "5", "4", "3", "2", "1", "0"
];
const SORTS = [
  { value: "star", label: "☆5獲得人数" },
  { value: "const", label: "譜面定数" }
];
const ORDERS = [
  { value: "desc", label: "降順" },
  { value: "asc", label: "昇順" }
];
const TECH_EXCLUDE = [
  { value: "yes", label: "する" },
  { value: "no", label: "しない" }
];

function isSp() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 480;
}

export default function Database() {
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [sort, setSort] = useState("star");
  const [order, setOrder] = useState("desc");
  const [techExclude, setTechExclude] = useState("no");
  const [modalOpen, setModalOpen] = useState<null | "level" | "other">(null);
  const [modalTab, setModalTab] = useState<"level" | "other">("level");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tableImageUrl, setTableImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // チェックボックスカスタム
  const renderLevelCheckbox = (level: string) => (
    <label
      key={level}
      className={`custom-check${selectedLevels.includes(level) ? " checked" : ""}`}
      style={{
        margin: "0 0.4em 0.4em 0",
        display: "inline-block",
        padding: "0.3em 0.8em",
        borderRadius: "8px",
        background: selectedLevels.includes(level) ? "rgba(61,90,128,0.15)" : "transparent",
        cursor: "pointer",
        border: "1px solid #98c1d9",
        fontWeight: selectedLevels.includes(level) ? "bold" : "normal"
      }}
    >
      <input
        type="checkbox"
        checked={selectedLevels.includes(level)}
        onChange={() =>
          setSelectedLevels(selectedLevels.includes(level)
            ? selectedLevels.filter(l => l !== level)
            : [...selectedLevels, level])
        }
        style={{ display: "none" }}
      />
      {level}
    </label>
  );

  // ラジオカスタム
  const renderRadio = (name: string, value: string, label: string, selected: string, setSelected: (v: string) => void) => (
    <label
      key={value}
      className={`custom-radio${selected === value ? " checked" : ""}`}
      style={{
        margin: "0 0.7em 0.7em 0",
        display: "inline-block",
        padding: "0.3em 0.8em",
        borderRadius: "8px",
        background: selected === value ? "rgba(61,90,128,0.15)" : "transparent",
        cursor: "pointer",
        border: "1px solid #98c1d9",
        fontWeight: selected === value ? "bold" : "normal"
      }}
    >
      <input
        type="radio"
        name={name}
        checked={selected === value}
        onChange={() => setSelected(value)}
        style={{ display: "none" }}
      />
      {label}
    </label>
  );

  // オプションを適用ボタンの共通ハンドラ
  const handleApplyOptions = async () => {
    setErrorMsg(null);
    setTableImageUrl(null);
    if (selectedLevels.length === 0) {
      setErrorMsg("レベルが選択されていません");
      return;
    }
    setLoading(true);
    try {
      // chartsコレクション取得
      const res = await fetch(
        "https://firestore.googleapis.com/v1/projects/ongeki-database/databases/(default)/documents/charts?pageSize=1000"
      );
      const json = await res.json();
      if (!json.documents) {
        setErrorMsg("データ取得に失敗しました");
        setLoading(false);
        return;
      }
      // fields存在チェック・整形
      const docs = json.documents
        .map((doc: any) => doc.fields)
        .filter((fields: any) => fields && fields.level && typeof fields.level.stringValue === "string");

      // レベルフィルタ
      let filtered = docs.filter((fields: any) =>
        selectedLevels.includes(fields.level.stringValue)
      );

      // テクチャレ除外
      if (techExclude === "yes") {
        filtered = filtered.filter(
          (fields: any) =>
            !fields.techFlag || fields.techFlag.booleanValue !== true
        );
      }

      // ソートキー定義
      const sortKeys =
        sort === "star"
          ? [
              "ps5TotalCount",
              "ps4Count",
              "ps3Count",
              "ps2Count",
              "ps1Count",
              "ps5RainbowCount",
              "chartConst",
              "ts1TheoryCount",
            ]
          : [
              "chartConst",
              "ps5TotalCount",
              "ps4Count",
              "ps3Count",
              "ps2Count",
              "ps1Count",
              "ps5RainbowCount",
              "ts1TheoryCount",
            ];

      // ソート関数
      filtered.sort((a: any, b: any) => {
        for (const key of sortKeys) {
          const va = a[key]?.integerValue ?? a[key]?.doubleValue ?? 0;
          const vb = b[key]?.integerValue ?? b[key]?.doubleValue ?? 0;
          if (va !== vb) {
            return order === "desc" ? vb - va : va - vb;
          }
        }
        return 0;
      });

      // 表示用データ整形
      const tableData = [
        [
          "楽曲名",
          "難易度",
          "レベル",
          "☆5(虹)",
          "☆5",
          "☆4",
          "☆3",
          "☆2",
          "☆1",
          "☆5合計",
          "譜面定数",
          "TS1位理論値回数",
        ],
        ...filtered.map((fields: any) => [
          fields.musicName?.stringValue ?? "",
          fields.difficulty?.stringValue ?? "",
          fields.level?.stringValue ?? "",
          fields.ps5RainbowCount?.integerValue ?? "",
          fields.ps5Count?.integerValue ?? "",
          fields.ps4Count?.integerValue ?? "",
          fields.ps3Count?.integerValue ?? "",
          fields.ps2Count?.integerValue ?? "",
          fields.ps1Count?.integerValue ?? "",
          fields.ps5TotalCount?.integerValue ?? "",
          fields.chartConst?.doubleValue ?? "",
          fields.ts1TheoryCount?.integerValue ?? "",
        ]),
      ];

      // canvas描画
      const cellW = 120;
      const cellH = 32;
      const maxCol = tableData[0].length;
      const maxRow = tableData.length;
      const canvasW = Math.min(cellW * maxCol, 1200);
      const canvasH = Math.min(cellH * maxRow, 8000);

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = Math.min(canvasH, window.innerHeight * 0.9);

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas error");

      // 背景
      ctx.fillStyle = "#e0fbfc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "bold 15px 'Segoe UI',sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (let r = 0; r < maxRow; ++r) {
        for (let c = 0; c < maxCol; ++c) {
          const x = c * cellW;
          const y = r * cellH;
          // ヘッダー色
          ctx.fillStyle = r === 0 ? "#3d5a80" : "#fff";
          ctx.fillRect(x, y, cellW, cellH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, y, cellW, cellH);
          ctx.fillStyle = r === 0 ? "#fff" : "#293241";
          ctx.fillText(
            String(tableData[r][c]),
            x + cellW / 2,
            y + cellH / 2,
            cellW - 8
          );
        }
      }

      setTableImageUrl(canvas.toDataURL());
    } catch (e: any) {
      setErrorMsg("データ取得・描画に失敗しました");
    }
    setLoading(false);
  };

  // PC/tab用オプションUI
  const renderOptionsPC = () => (
    <div style={{
      margin: "2rem 0 1.5rem 0",
      padding: "1.2rem",
      background: "rgba(152,193,217,0.10)",
      borderRadius: "12px"
    }}>
      <div style={{ marginBottom: "1.2em" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>レベル選択</div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {LEVELS.map(renderLevelCheckbox)}
        </div>
      </div>
      <div style={{ marginBottom: "1.2em" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>ソート順</div>
        <div style={{ marginBottom: "0.5em" }}>
          {SORTS.map(opt => renderRadio("sort", opt.value, opt.label, sort, setSort))}
        </div>
        <div style={{ marginBottom: "0.5em" }}>
          {ORDERS.map(opt => renderRadio("order", opt.value, opt.label, order, setOrder))}
        </div>
        <div>
          <span style={{ fontWeight: "bold", marginRight: "0.7em" }}>テクニカルチャレンジ対象曲を除外</span>
          {TECH_EXCLUDE.map(opt => renderRadio("tech", opt.value, opt.label, techExclude, setTechExclude))}
        </div>
      </div>
      <button
        style={{
          marginTop: "1.2em",
          background: "var(--main-blue)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.7em 2.2em",
          fontWeight: "bold",
          fontSize: "1.1em",
          cursor: "pointer"
        }}
        onClick={handleApplyOptions}
      >
        オプションを適用
      </button>
    </div>
  );

  // sp用オプションUI
  const renderOptionsSP = () => (
    <>
      <div
        id="sp-option-bar"
        style={{
          display: "flex",
          gap: "1rem",
          margin: "1.5rem 0 1.2rem 0",
        }}
      >
        <button
          style={{
            flex: 1,
            background: "var(--main-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.7em 0",
            fontWeight: "bold",
            fontSize: "1.1em",
            cursor: "pointer"
          }}
          onClick={() => { setModalOpen("level"); setModalTab("level"); }}
        >
          レベル選択
        </button>
        <button
          style={{
            flex: 1,
            background: "var(--main-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "0.7em 0",
            fontWeight: "bold",
            fontSize: "1.1em",
            cursor: "pointer"
          }}
          onClick={() => { setModalOpen("other"); setModalTab("other"); }}
        >
          その他オプション
        </button>
      </div>
      {/* モーダル */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(41,50,65,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "14px",
            width: "92vw",
            maxWidth: 400,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 4px 24px rgba(61,90,128,0.18)",
            padding: "1.2em 1em",
            zIndex: 9999
          }}>
            {/* タブ切り替え */}
            <div style={{ display: "flex", marginBottom: "1.2em" }}>
              <button
                style={{
                  flex: 1,
                  background: modalTab === "level" ? "var(--main-blue)" : "#eee",
                  color: modalTab === "level" ? "#fff" : "#293241",
                  border: "none",
                  borderRadius: "8px 0 0 8px",
                  padding: "0.7em 0",
                  fontWeight: "bold",
                  fontSize: "1.1em",
                  cursor: "pointer"
                }}
                onClick={() => setModalTab("level")}
              >
                レベル選択
              </button>
              <button
                style={{
                  flex: 1,
                  background: modalTab === "other" ? "var(--main-blue)" : "#eee",
                  color: modalTab === "other" ? "#fff" : "#293241",
                  border: "none",
                  borderRadius: "0 8px 8px 0",
                  padding: "0.7em 0",
                  fontWeight: "bold",
                  fontSize: "1.1em",
                  cursor: "pointer"
                }}
                onClick={() => setModalTab("other")}
              >
                その他オプション
              </button>
            </div>
            {/* タブ内容 */}
            {modalTab === "level" ? (
              <div style={{ marginBottom: "1.2em" }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>レベル選択</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {LEVELS.map(renderLevelCheckbox)}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "1.2em" }}>
                <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>ソート順</div>
                <div style={{ marginBottom: "0.5em" }}>
                  {SORTS.map(opt => renderRadio("sort", opt.value, opt.label, sort, setSort))}
                </div>
                <div style={{ marginBottom: "0.5em" }}>
                  {ORDERS.map(opt => renderRadio("order", opt.value, opt.label, order, setOrder))}
                </div>
                <div>
                  <span style={{ fontWeight: "bold", marginRight: "0.7em" }}>テクニカルチャレンジ対象曲を除外</span>
                  {TECH_EXCLUDE.map(opt => renderRadio("tech", opt.value, opt.label, techExclude, setTechExclude))}
                </div>
              </div>
            )}
            <button
              style={{
                marginTop: "1.2em",
                background: "var(--main-blue)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.7em 2.2em",
                fontWeight: "bold",
                fontSize: "1.1em",
                cursor: "pointer"
              }}
              onClick={() => {
                setModalOpen(null);
                handleApplyOptions();
              }}
            >
              オプションを適用
            </button>
          </div>
          {/* モーダル外クリックで閉じる */}
          <div
            style={{
              position: "fixed",
              top: 0, left: 0, width: "100vw", height: "100vh",
              zIndex: 1
            }}
            onClick={() => setModalOpen(null)}
          />
        </div>
      )}
    </>
  );

  // sp判定
  const [isSpState, setIsSpState] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsSpState(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <Header />
      <main style={{ padding: "64px 1rem 2rem 1rem", maxWidth: 900, margin: "0 auto" }}>
        <Title>☆獲得人数一覧</Title>
        <section style={{ color: "#293241", fontSize: "1rem", lineHeight: "2", margin: "2.5rem 0" }}>
          各楽曲の☆獲得人数を一覧表で閲覧できます。<br />
          オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。
        </section>
        {isSpState ? renderOptionsSP() : renderOptionsPC()}
        {loading && <div style={{ color: "#3d5a80", margin: "1.5em 0" }}>データ取得中...</div>}
        {errorMsg && <div style={{ color: "#ee6c4d", margin: "1.5em 0" }}>{errorMsg}</div>}
        {tableImageUrl && (
          <div style={{ margin: "2em 0", overflowX: "auto" }}>
            <img src={tableImageUrl} alt="一覧表" style={{ maxWidth: "100%" }} />
          </div>
        )}
      </main>
    </>
  );
}
