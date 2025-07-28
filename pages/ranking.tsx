import { useEffect, useState } from "react";
import Title from "@/components/Title";
import Header from "@/components/Header";

const TAB_LIST = [
  { key: "ts1", label: "TS1位理論値回数" },
  { key: "ps", label: "PS理論値人数" },
];

export default function Ranking() {
  const [tab, setTab] = useState<"ts1" | "ps">("ts1");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 初期表示時ログ
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // fetch("/api/insertLog", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     action: "理論値ランキング表示",
    //     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  }, []);

  useEffect(() => {
    setImgUrl(null);
    setLoading(true);
    fetch("/data/data.json")
      .then((res) => res.json())
      .then((json) => {
        if (!Array.isArray(json)) return;
        let filtered: any[] = [];
        let header: string[] = [];
        let rows: any[][] = [];
        if (tab === "ts1") {
          filtered = json.filter(
            (item: any) => Number(item.ts1TheoryCount ?? 0) >= 10
          );
          filtered.sort((a: any, b: any) => {
            const ta = Number(a.ts1TheoryCount ?? 0);
            const tb = Number(b.ts1TheoryCount ?? 0);
            if (ta !== tb) return tb - ta;
            const ca = Number(a.chartConst ?? 0);
            const cb = Number(b.chartConst ?? 0);
            return cb - ca;
          });
          header = ["Title", "Diff", "Lev", "TS1 Count"];
          rows = filtered.map((item) => [
            item.musicName ?? "",
            item.difficulty ?? "",
            item.level ?? "",
            item.ts1TheoryCount ?? "",
          ]);
        } else {
          filtered = json.filter(
            (item: any) => Number(item.psTheoryCount ?? 0) >= 1
          );
          filtered.sort((a: any, b: any) => {
            const pa = Number(a.psTheoryCount ?? 0);
            const pb = Number(b.psTheoryCount ?? 0);
            if (pa !== pb) return pb - pa;
            const ca = Number(a.chartConst ?? 0);
            const cb = Number(b.chartConst ?? 0);
            return cb - ca;
          });
          header = ["Title", "Diff", "Lev", "PS Count"];
          rows = filtered.map((item) => [
            item.musicName ?? "",
            item.difficulty ?? "",
            item.level ?? "",
            item.psTheoryCount ?? "",
          ]);
        }
        // canvas描画
        // 画像仕様: 上端・下端ボーダー、左右余白、カラム色・背景色
        const rowH = 38;
        const headerH = 60;
        const leftMargin = 18;
        const rightMargin = 18;
        // カラム幅割合: 8:3:2:3
        const colRatio = [8, 3, 2, 3];
        const totalRatio = colRatio.reduce((a, b) => a + b, 0);
        const tableW = 900;
        const colW = colRatio.map((r) =>
          Math.round((tableW - leftMargin - rightMargin) * r / totalRatio)
        );
        const canvasW = tableW;
        const canvasH = headerH + rowH * rows.length + rowH + 60;

        // TS1/PS-MAX値の最大・最小取得
        let minVal = 99999,
          maxVal = -99999;
        if (tab === "ts1") {
          for (const row of rows) {
            const v = Number(row[3]);
            if (!isNaN(v)) {
              minVal = Math.min(minVal, v);
              maxVal = Math.max(maxVal, v);
            }
          }
          minVal = Math.max(minVal, 10);
          maxVal = Math.min(maxVal, 999);
        } else {
          for (const row of rows) {
            const v = Number(row[3]);
            if (!isNaN(v)) {
              minVal = Math.min(minVal, v);
              maxVal = Math.max(maxVal, v);
            }
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 背景
        ctx.fillStyle = "#e0fbfc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        // ヘッダー
        const header2 =
          tab === "ts1"
            ? ["Title", "Diff", "Lev", "TS1 Count"]
            : ["Title", "Diff", "Lev", "PS-MAX Count"];
        let x = leftMargin;
        ctx.font = "bold 16px 'Segoe UI',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let c = 0; c < header.length; ++c) {
          ctx.fillStyle = "#3d5a80";
          ctx.fillRect(x, headerH, colW[c], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH, colW[c], rowH);
          ctx.fillStyle = "#fff";
          ctx.fillText(
            header2[c],
            x + colW[c] / 2,
            headerH + rowH / 2,
            colW[c] - 8
          );
          x += colW[c];
        }

        // 本体
        ctx.font = "15px 'Segoe UI',sans-serif";
        for (let r = 0; r < rows.length; ++r) {
          let x = leftMargin;
          const item = rows[r];
          // Title背景色
          let bgColor = "#fff";
          switch (item[1]) {
            case "MASTER":
              bgColor = "#f3e6fa";
              break;
            case "EXPERT":
              bgColor = "#fde6f3";
              break;
            case "ADVANCED":
              bgColor = "#fff2e0";
              break;
            case "BASIC":
              bgColor = "#e6fae6";
              break;
            case "LUNATIC":
              bgColor = "#f3f3f3";
              break;
          }
          // Title
          ctx.fillStyle = bgColor;
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[0],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[0],
            rowH
          );
          ctx.fillStyle = "#293241";
          ctx.textAlign = "left";
          ctx.font = "bold 18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[0] ?? "",
            x + 12,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[0] - 24
          );
          x += colW[0];

          // Diff
          let diffColor = "#293241";
          switch (item[1]) {
            case "MASTER":
              diffColor = "#a259e6";
              break;
            case "EXPERT":
              diffColor = "#e0408a";
              break;
            case "ADVANCED":
              diffColor = "#ff9800";
              break;
            case "BASIC":
              diffColor = "#7ed957";
              break;
            case "LUNATIC":
              diffColor = "#222";
              break;
          }
          ctx.fillStyle = "#fff";
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[1],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[1],
            rowH
          );
          ctx.fillStyle = diffColor;
          ctx.textAlign = "center";
          ctx.font = "bold 18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[1] ?? "",
            x + colW[1] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[1] - 8
          );
          x += colW[1];

          // Lev
          ctx.fillStyle = "#fff";
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[2],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[2],
            rowH
          );
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[2] ?? "",
            x + colW[2] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[2] - 8
          );
          x += colW[2];

          // TS1 Count or PS-MAX Count
          let val = Number(item[3]);
          let bg = "#fff",
            fg = "#293241";
          if (tab === "ts1") {
            if (val >= 1000) {
              bg = "#222";
              fg = "#fff";
            } else {
              // 10で白、999で黄色
              const ratio = Math.max(0, Math.min(1, (val - 10) / (999 - 10)));
              // 白→黄色
              const r = Math.round(255);
              const g = Math.round(255 * (1 - ratio) + 255 * ratio);
              const b = Math.round(255 * (1 - ratio));
              bg = `rgb(${r},${g},${b})`;
              fg = "#293241";
            }
          } else {
            // PS-MAX Count
            if (maxVal > minVal) {
              const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
              const r = Math.round(255);
              const g = Math.round(255 * (1 - ratio) + 255 * ratio);
              const b = Math.round(255 * (1 - ratio));
              bg = `rgb(${r},${g},${b})`;
              fg = "#293241";
            }
          }
          ctx.fillStyle = bg;
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[3],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[3],
            rowH
          );
          ctx.fillStyle = fg;
          ctx.textAlign = "center";
          ctx.font = "bold 20px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[3] ?? "",
            x + colW[3] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[3] - 8
          );
        }
        setImgUrl(canvas.toDataURL());
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const handleTabChange = (key: "ts1" | "ps") => {
    setTab(key);
    let userId = "";
    let optionStr = "";
    if (typeof window !== "undefined") {
      userId = localStorage.getItem("user-id") || "";
      // localStorage全要素をJson化
      const obj: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; ++i) {
        const keyName = localStorage.key(i);
        if (keyName) obj[keyName] = localStorage.getItem(keyName) ?? "";
      }
      optionStr = JSON.stringify(obj);
    }
    fetch("/api/insertLog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: key === "ts1" ? "TS1位理論値回数ランキングを表示" : "PS理論値人数ランキングを表示",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
        userId,
        option: optionStr,
      }),
    });
  };

  return (
    <>
      <Header />
      <main
        style={{
          padding: "64px 1rem 2rem 1rem",
          maxWidth: 700,
          margin: "0 auto",
          color: "#293241",
          fontSize: "1rem",
        }}
      >
        <Title>理論値ランキング</Title>
        <div style={{ margin: "1.5em 0 1em 0", lineHeight: 1.8 }}>
          <b>テクニカルスコアランキング1位の理論値回数</b>及び
          <b>Pスコア理論値達成人数</b>
          をランキング形式で閲覧できます。<br />
          オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key as "ts1" | "ps")}
              style={{
                flex: 1,
                padding: "0.5em 0",
                background: tab === t.key ? "#3d5a80" : "#e0fbfc",
                color: tab === t.key ? "#fff" : "#293241",
                border: "none",
                borderBottom:
                  tab === t.key
                    ? "3px solid #ee6c4d"
                    : "3px solid #98c1d9",
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          style={{
            minHeight: 200,
            background: "#e0fbfc",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          {loading && (
            <div style={{ color: "#98c1d9", padding: "2em" }}>読み込み中...</div>
          )}
          {!loading && imgUrl && (
            <img
              src={imgUrl}
              alt="ランキング表"
              style={{
                maxWidth: "100%",
                borderRadius: 8,
                boxShadow: "0 2px 8px #98c1d966",
              }}
            />
          )}
        </div>
      </main>
    </>
  );
}
