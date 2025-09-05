import React, { useState, useRef, useEffect } from "react";
import Title from "@/components/Title";
import Header from "@/components/Header";

const LEVELS = [
  "15+", "15", "14+", "14", "13+", "13", "12+", "12", "11+", "11", "10+", "10",
  "9+", "9", "8+", "8", "7+", "7", "6", "5", "4", "3", "2", "1", "0"
];
const SORTS = [
  { value: "star", label: "☆5 人数" },
  { value: "rainbow", label: "☆5(虹) 人数" },
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
const SOLO_EXCLUDE = [
  { value: "yes", label: "する" },
  { value: "no", label: "しない" }
];

function isSp() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 480;
}

// UUID生成ユーティリティ
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function Database() {
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [sort, setSort] = useState("star");
  const [order, setOrder] = useState("desc");
  const [techExclude, setTechExclude] = useState("no");
  const [soloExclude, setSoloExclude] = useState("yes");
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
      style={{
        margin: "0 0.4em 0.4em 0",
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: 20,
        fontWeight: "bold", // 常に太字
        color: selectedLevels.includes(level) ? "#fff" : "#3d5a80",
        background: selectedLevels.includes(level)
          ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)"
          : "#f3f6fa",
        border: "1.5px solid #98c1d9",
        cursor: "pointer",
        transition: "background 0.2s,color 0.2s",
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

  // 分割ボタン用スタイル
  const segmentedControlStyle = {
    display: "inline-flex",
    borderRadius: "999px",
    overflow: "hidden",
    border: "1.5px solid #98c1d9",
    background: "#e0fbfc",
    marginBottom: "1rem",
    gap: "0px"
  };
  const segmentStyle = (selected: boolean) => ({
    padding: "8px 18px",
    background: selected ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)" : "#f3f6fa",
    color: selected ? "#fff" : "#3d5a80",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1.05em",
    transition: "background 0.2s",
    minWidth: "unset",
    flex: "unset",
  });

  // オプション初期値 localStorageから取得
  useEffect(() => {
    if (typeof window === "undefined") return;
    const levels = localStorage.getItem("database-level");
    if (levels) {
      try {
        const arr = JSON.parse(levels);
        if (Array.isArray(arr)) setSelectedLevels(arr);
      } catch {}
    }
    const sort = localStorage.getItem("database-sort");
    if (sort === "star" || sort === "const" || sort === "rainbow") setSort(sort);
    const order = localStorage.getItem("database-asc-desc");
    if (order === "asc" || order === "desc") setOrder(order);
    const tech = localStorage.getItem("database-tech-exclude");
    if (tech === "yes" || tech === "no") setTechExclude(tech);
    const solo = localStorage.getItem("database-solo-exclude");
    if (solo === "yes" || solo === "no") setSoloExclude(solo);
  }, []);

  // user-id チェック
  useEffect(() => {
    if (typeof window === "undefined") return;
    let uid = localStorage.getItem("user-id");
    if (!uid) {
      uid = generateUUID();
      localStorage.setItem("user-id", uid);
    }
  }, []);

  // オプションを適用ボタンの共通ハンドラ
  const handleApplyOptions = async () => {
    // オプションをlocalStorageに保存
    if (typeof window !== "undefined") {
      localStorage.setItem("database-level", JSON.stringify(selectedLevels));
      localStorage.setItem("database-sort", sort);
      localStorage.setItem("database-asc-desc", order);
      localStorage.setItem("database-tech-exclude", techExclude);
      localStorage.setItem("database-solo-exclude", soloExclude);
    }
    setErrorMsg(null);
    setTableImageUrl(null);
    if (selectedLevels.length === 0) {
      setErrorMsg("レベルが選択されていません");
      return;
    }
    setLoading(true);
    try {
      // data.json取得
      const res = await fetch("/data/data.json");
      const json = await res.json();
      if (!Array.isArray(json)) {
        setErrorMsg("データ取得に失敗しました");
        setLoading(false);
        return;
      }
      // レベルフィルタ
      let filtered = json.filter((item: any) =>
        item.level && selectedLevels.includes(item.level)
      );
      // テクチャレ除外
      if (techExclude === "yes") {
        filtered = filtered.filter(
          (item: any) => !item.techFlag
        );
      }
      // ソロver.除外
      if (soloExclude === "yes") {
        filtered = filtered.filter(
          (item: any) => !(item.musicName && item.musicName.includes("ソロver"))
        );
      }

      // 画像生成前にデータ数チェック
      if (filtered.length > 2000) {
        setErrorMsg("選択レベルが多いため正常に生成できませんでした。\n選択数を減らして再度お試しください。");
        setLoading(false);
        return;
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
          : sort === "rainbow"
          ? [
              "ps5RainbowCount",
              "ps5TotalCount",
              "ps4Count",
              "ps3Count",
              "ps2Count",
              "ps1Count",
              "chartConst",
              "ts1TheoryCount",
            ]
          : sort === "const"
          ? [
              "chartConst",
              "ps5TotalCount",
              "ps4Count",
              "ps3Count",
              "ps2Count",
              "ps1Count",
              "ps5RainbowCount",
              "ts1TheoryCount",
            ]
          : [];
      // ソート関数
      filtered.sort((a: any, b: any) => {
        for (const key of sortKeys) {
          const va = Number(a[key] ?? 0);
          const vb = Number(b[key] ?? 0);
          if (va !== vb) {
            return order === "desc" ? vb - va : va - vb;
          }
        }
        return 0;
      });

      // オプション文字列
      const optionStr = [
        `レベル: ${selectedLevels.join(",")}`,
        `ソート: ${sort === "star" ? "☆5獲得人数" : "譜面定数"}${order === "desc" ? "降順" : "昇順"}`,
        `テクチャレ除外: ${techExclude === "yes" ? "する" : "しない"}`,
        `ソロver.除外: ${soloExclude === "yes" ? "する" : "しない"}`
      ].join(" / ");

      // 表示用データ整形
      const tableData = [
        [
          "楽曲名",
          "難易度",
          "レベル",
          "譜面定数",
          "☆5人数",
        ],
        ...filtered.map((item: any) => [
          item.musicName ?? "",
          item.difficulty ?? "",
          item.level ?? "",
          item.chartConst ?? "",
          item.ps5TotalCount ?? "",
          // 右側帯グラフ用データは後で参照
        ]),
      ];

      // レイアウト定義
      const rowH = 28;
      const headerH = 120;
      const leftMargin = 18;
      const rightMargin = 18;
      // カラム幅割合: 6:2:2:1:6
      const colRatio = [6, 2, 2, 1, 6];
      const totalRatio = colRatio.reduce((a, b) => a + b, 0);
      const tableW = 900;
      const colW = colRatio.map(r => Math.round((tableW - leftMargin - rightMargin) * r / totalRatio));
      const canvasW = tableW;
      const canvasH = headerH + rowH * filtered.length + 60;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas error");

      // 背景
      ctx.fillStyle = "#e0fbfc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // サイトロゴ描画（左上端）
      const logoX = leftMargin;
      const logoY = 18;
      const logoW = 130;
      const logoH = 44;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(logoX + 8, logoY);
      ctx.lineTo(logoX + logoW - 8, logoY);
      ctx.quadraticCurveTo(logoX + logoW, logoY, logoX + logoW, logoY + 8);
      ctx.lineTo(logoX + logoW, logoY + logoH - 8);
      ctx.quadraticCurveTo(logoX + logoW, logoY + logoH, logoX + logoW - 8, logoY + logoH);
      ctx.lineTo(logoX + 8, logoY + logoH);
      ctx.quadraticCurveTo(logoX, logoY + logoH, logoX, logoY + logoH - 8);
      ctx.lineTo(logoX, logoY + 8);
      ctx.quadraticCurveTo(logoX, logoY, logoX + 8, logoY);
      ctx.closePath();
      ctx.fillStyle = "#3d5a80";
      ctx.shadowColor = "#29324133";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();

      // favicon.ico描画
      try {
        const favicon = new window.Image();
        favicon.src = "/favicon.ico";
        await new Promise<void>((resolve) => {
          favicon.onload = () => resolve();
          favicon.onerror = () => resolve();
        });
        ctx.drawImage(favicon, logoX + 6, logoY + 6, 32, 32);
      } catch {}
      // テキスト
      ctx.save();
      ctx.font = "bold 15px 'Segoe UI',sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(41,50,65,0.10)";
      ctx.shadowBlur = 0;
      ctx.fillText("Pongeki", logoX + 44 + 10, logoY + logoH / 2);
      ctx.restore();

      // 上端ボーダー
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasW, 0);
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ee6c4d";
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.floor(canvasW * 0.3), 0);
      ctx.stroke();
      ctx.strokeStyle = "#3d5a80";
      ctx.moveTo(Math.floor(canvasW * 0.3), 0);
      ctx.lineTo(canvasW, 0);
      ctx.stroke();
      ctx.restore();

      // 下端ボーダー
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, canvasH - 1);
      ctx.lineTo(canvasW, canvasH - 1);
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ee6c4d";
      ctx.moveTo(0, canvasH - 1);
      ctx.lineTo(Math.floor(canvasW * 0.3), canvasH - 1);
      ctx.stroke();
      ctx.strokeStyle = "#3d5a80";
      ctx.moveTo(Math.floor(canvasW * 0.3), canvasH - 1);
      ctx.lineTo(canvasW, canvasH - 1);
      ctx.stroke();
      ctx.restore();

      // タイトル・オプションエリア（オプションは上部右詰め）
      ctx.font = "bold 28px 'Segoe UI',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#3d5a80";
      ctx.fillText("☆獲得人数一覧", leftMargin + (tableW - leftMargin - rightMargin) / 2, headerH / 2);

      // オプション表示（上部右詰め、表の右側ではなく上部に）
      ctx.save();
      ctx.font = "15px 'Segoe UI',sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#293241";
      const optX = canvasW - 24;
      let optY = 26;
      ctx.fillText(new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
      // selectedLevel（6個目以降は ... に変換して表示）
      if (selectedLevels.length > 6) {
        ctx.fillText("Level: " + selectedLevels.slice(0, 6).join(", ") + ", ...", optX, optY + 20);
      } else {
        ctx.fillText("Level: " + selectedLevels.join(", "), optX, optY + 20);
      }
      ctx.fillText("Sort: " + (sort === "star" ? "☆5人数" : sort === "rainbow" ? "☆5(虹)人数" : "譜面定数") + " " + (order === "desc" ? "降順" : "昇順"), optX, optY + 40);
      ctx.fillText("テクチャレ対象曲: " + (techExclude === "yes" ? "除外する" : "除外しない"), optX, optY + 60);
      ctx.fillText("ソロver.対象曲: " + (soloExclude === "yes" ? "除外する" : "除外しない"), optX, optY + 80);
      ctx.restore();

      // テーブルヘッダー
      const headers = sort === "rainbow"
        ? ["Title", "Diff", "Lev(Const)", "☆5RCnt", "☆5Distr"]
        : ["Title", "Diff", "Lev(Const)", "☆5Cnt", "☆5Distr"];
      let x = leftMargin;
      ctx.font = "bold 16px 'Segoe UI',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let c = 0; c < headers.length; ++c) {
        ctx.fillStyle = "#3d5a80";
        ctx.fillRect(x, headerH, colW[c], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH, colW[c], rowH);
        ctx.fillStyle = "#fff";
        ctx.fillText(headers[c], x + colW[c] / 2, headerH + rowH / 2, colW[c] - 8);
        x += colW[c];
      }

      // テーブル本体
      for (let r = 0; r < filtered.length; ++r) {
        let x = leftMargin;
        const item = filtered[r];
        // Title背景色
        let bgColor = "#fff";
        switch (item.difficulty) {
          case "MASTER": bgColor = "#f3e6fa"; break;
          case "EXPERT": bgColor = "#fde6f3"; break;
          case "ADVANCED": bgColor = "#fff2e0"; break;
          case "BASIC": bgColor = "#e6fae6"; break;
          case "LUNATIC": bgColor = "#f3f3f3"; break;
        }
        // Title
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, headerH + rowH * (r + 1), colW[0], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH + rowH * (r + 1), colW[0], rowH);
        ctx.fillStyle = "#293241";
        ctx.textAlign = "left";
        ctx.font = "bold 15px 'Segoe UI',sans-serif";
        ctx.fillText(item.musicName ?? "", x + 12, headerH + rowH * (r + 1) + rowH / 2, colW[0] - 24);
        x += colW[0];

        // Diff
        let diffColor = "#293241";
        switch (item.difficulty) {
          case "MASTER": diffColor = "#a259e6"; break;
          case "EXPERT": diffColor = "#e0408a"; break;
          case "ADVANCED": diffColor = "#ff9800"; break;
          case "BASIC": diffColor = "#7ed957"; break;
          case "LUNATIC": diffColor = "#222"; break;
        }
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, headerH + rowH * (r + 1), colW[1], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH + rowH * (r + 1), colW[1], rowH);
        ctx.fillStyle = diffColor;
        ctx.textAlign = "center";
        ctx.font = "bold 15px 'Segoe UI',sans-serif";
        ctx.fillText(item.difficulty ?? "", x + colW[1] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[1] - 8);
        x += colW[1];

        // Lev(Const)
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, headerH + rowH * (r + 1), colW[2], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH + rowH * (r + 1), colW[2], rowH);
        ctx.fillStyle = "#293241";
        ctx.textAlign = "center";
        ctx.font = "15px 'Segoe UI',sans-serif";
        let chartConstDisp = "";
        if (item.chartConst !== undefined && item.chartConst !== null && item.chartConst !== "") {
          let num = Number(item.chartConst);
          chartConstDisp = isNaN(num) ? String(item.chartConst) : num.toFixed(1);
        }
        ctx.fillText(
          `${item.level ?? ""}${chartConstDisp ? ` (${chartConstDisp})` : ""}`,
          x + colW[2] / 2,
          headerH + rowH * (r + 1) + rowH / 2,
          colW[2] - 8
        );
        x += colW[2];

        // ☆5Cnt or ☆5RCnt
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, headerH + rowH * (r + 1), colW[3], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH + rowH * (r + 1), colW[3], rowH);
        if (sort === "rainbow") {
          ctx.fillStyle = (item.ps5RainbowCount == "100" ? "#ee6c4d" : "#293241");
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
        } else {
          ctx.fillStyle = (item.ps5TotalCount == "100" ? "#ee6c4d" : "#293241");
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
        }
        if (sort === "rainbow") {
          ctx.fillText(item.ps5RainbowCount ?? "", x + colW[3] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[3] - 8);
        } else {
          ctx.fillText(item.ps5TotalCount ?? "", x + colW[3] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[3] - 8);
        }
        x += colW[3];

        // ☆5Distr（帯グラフ）
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, headerH + rowH * (r + 1), colW[4], rowH);
        ctx.clip();

        // データ取得
        const rainbow = Number(item.ps5RainbowCount ?? 0);
        const star5 = Number(item.ps5Count ?? 0);
        const star4 = Number(item.ps4Count ?? 0);
        const star3 = Number(item.ps3Count ?? 0);
        const star2 = Number(item.ps2Count ?? 0);
        const star1 = Number(item.ps1Count ?? 0);
        let remain = 100;
        const segs = [
          { n: rainbow, type: "rainbow" },
          { n: star5, type: "red" },
          { n: star4, type: "orange" },
          { n: star3, type: "yellow" },
          { n: star2, type: "green" },
          { n: star1, type: "blue" },
        ].map((v) => {
          const use = Math.max(0, Math.min(remain, v.n));
          remain -= use;
          return { ...v, n: use };
        });
        if (remain > 0) segs.push({ n: remain, type: "gray" });

        // 各セグメント描画
        let segX = x;
        const segW = colW[4] / 100;
        for (const seg of segs) {
          if (seg.n <= 0) continue;
          if (seg.type === "rainbow") {
            for (let i = 0; i < seg.n; ++i) {
              const grad = ctx.createLinearGradient(
                segX + i * segW, headerH + rowH * (r + 1),
                segX + (i + 1) * segW, headerH + rowH * (r + 2)
              );
              grad.addColorStop(0, "#ff0000");
              grad.addColorStop(0.2, "#ffa500");
              grad.addColorStop(0.4, "#ffff00");
              grad.addColorStop(0.6, "#00ff00");
              grad.addColorStop(0.8, "#00bfff");
              grad.addColorStop(1, "#800080");
              ctx.fillStyle = grad;
              ctx.fillRect(segX + i * segW, headerH + rowH * (r + 1), segW, rowH);
            }
            segX += seg.n * segW;
            continue;
          }
          if (seg.type === "red") ctx.fillStyle = "#ff0000";
          else if (seg.type === "orange") ctx.fillStyle = "#ffa500";
          else if (seg.type === "yellow") ctx.fillStyle = "#ffff00";
          else if (seg.type === "green") ctx.fillStyle = "#00ff00";
          else if (seg.type === "blue") ctx.fillStyle = "#00bfff";
          else ctx.fillStyle = "#c0c0c0";
          ctx.fillRect(segX, headerH + rowH * (r + 1), seg.n * segW, rowH);
          segX += seg.n * segW;
        }
        ctx.restore();
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH + rowH * (r + 1), colW[4], rowH);
      }

      // ログ送信 try catch
      try {
        let userId = "";
        let optionStr = "";
        if (typeof window !== "undefined") {
          userId = localStorage.getItem("user-id") || "";
          // localStorage全要素をJson化
          const obj: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; ++i) {
            const key = localStorage.key(i);
            if (key) obj[key] = localStorage.getItem(key) ?? "";
          }
          optionStr = JSON.stringify(obj);
        }
        await fetch("/api/insertLog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "☆獲得人数一覧画像を生成",
            option: optionStr,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            timestamp: new Date().toISOString(),
            userId,
          }),
        })
      } catch (logError) {
        // ログ送信失敗時は無視
      }

      setTableImageUrl(canvas.toDataURL());
    } catch (e: any) {
      setErrorMsg("データ取得・描画に失敗しま した");
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
      {/* 区切り線 */}
      <div style={{ borderTop: "1px solid #e0e6ed", margin: "1.2em 2em" }} />
      <div style={{ marginBottom: "1.2em" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>ソート順</div>
        <div style={segmentedControlStyle}>
          {SORTS.map(opt => (
            <button
              key={opt.value}
              style={segmentStyle(sort === opt.value)}
              onClick={() => setSort(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>降順／昇順</div>
        <div style={segmentedControlStyle}>
          {ORDERS.map(opt => (
            <button
              key={opt.value}
              style={segmentStyle(order === opt.value)}
              onClick={() => setOrder(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* 区切り線 */}
        <div style={{ borderTop: "1px solid #e0e6ed", margin: "1.2em 2em" }} />
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>テクニカルチャレンジ対象曲を除外</div>
          <div style={segmentedControlStyle}>
            <button
              style={segmentStyle(techExclude === "yes")}
              onClick={() => setTechExclude("yes")}
              type="button"
            >
              する
            </button>
            <button
              style={segmentStyle(techExclude === "no")}
              onClick={() => setTechExclude("no")}
              type="button"
            >
              しない
            </button>
          </div>
        </div>
        {/* ソロver.除外 */}
        <div style={{ marginTop: "0" }}>
          <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>ソロver.を除外</div>
          <div style={segmentedControlStyle}>
            <button
              style={segmentStyle(soloExclude === "yes")}
              onClick={() => setSoloExclude("yes")}
              type="button"
            >
              する
            </button>
            <button
              style={segmentStyle(soloExclude === "no")}
              onClick={() => setSoloExclude("no")}
              type="button"
            >
              しない
            </button>
          </div>
        </div>
      </div>
      <button
        style={{
          minWidth: 200,
          fontSize: "1.08rem",
          fontWeight: "bold",
          background: "linear-gradient(90deg, #ee6c4d 0%, #3d5a80 100%)",
          border: "none",
          borderRadius: 8,
          color: "#fff",
          padding: "14px 32px",
          marginTop: 8,
          cursor: "pointer",
          boxShadow: "0 2px 8px #98c1d933",
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
        <>
          <style>{`body { overflow: hidden !important; }`}</style>
          <div style={{
            position: "fixed",
            top: -50, left: 0, width: "100vw", height: "100vh",
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
                  <div style={segmentedControlStyle}>
                    {SORTS.map(opt => (
                      <button
                        key={opt.value}
                        style={segmentStyle(sort === opt.value)}
                        onClick={() => setSort(opt.value)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>降順／昇順</div>
                  <div style={segmentedControlStyle}>
                    {ORDERS.map(opt => (
                      <button
                        key={opt.value}
                        style={segmentStyle(order === opt.value)}
                        onClick={() => setOrder(opt.value)}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {/* 区切り線 */}
                  <div style={{ borderTop: "1px solid #e0e6ed", margin: "1.2em 2em" }} />
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>テクニカルチャレンジ対象曲を除外</div>
                    <div style={segmentedControlStyle}>
                      <button
                        style={segmentStyle(techExclude === "yes")}
                        onClick={() => setTechExclude("yes")}
                        type="button"
                      >
                        する
                      </button>
                      <button
                        style={segmentStyle(techExclude === "no")}
                        onClick={() => setTechExclude("no")}
                        type="button"
                      >
                        しない
                      </button>
                    </div>
                  </div>
                  {/* ソロver.除外 */}
                  <div style={{ marginTop: "0" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "0.5em" }}>ソロver.を除外</div>
                    <div style={segmentedControlStyle}>
                      <button
                        style={segmentStyle(soloExclude === "yes")}
                        onClick={() => setSoloExclude("yes")}
                        type="button"
                      >
                        する
                      </button>
                      <button
                        style={segmentStyle(soloExclude === "no")}
                        onClick={() => setSoloExclude("no")}
                        type="button"
                      >
                        しない
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <button
                style={{
                  minWidth: 200,
                  fontSize: "1.08rem",
                  fontWeight: "bold",
                  background: "linear-gradient(90deg, #ee6c4d 0%, #3d5a80 100%)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  padding: "14px 32px",
                  marginTop: 8,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #98c1d933",
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
        </>
      )}
    </>
  );

  // sp判定
  const [isSpState, setIsSpState] = useState(false);
  useEffect(() => {
    const check = () => setIsSpState(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 初期表示時ログ（useEffectは1つだけ）
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // fetch("/api/insertLog", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     action: "☆獲得人数一覧表示",
    //     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
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
            <div style={{ color: "#293241", textAlign: 'center', margin: '0 30px 30px' }}>
              ※ オンゲキアドベンチャー解禁曲は集計が遅れる場合があります。
            </div>
            <img src={tableImageUrl} alt="一覧表" style={{ maxWidth: "100%" }} />
          </div>
        )}
      </main>
    </>
  );
}
