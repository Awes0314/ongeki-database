import { useRef, useState } from "react";
import Title from "@/components/Title";
import Header from "@/components/Header";

type SongRow = {
  musicName: string;
  difficulty: string;
  level: string;
  chartConst: string;
  ps5Rating: string;
  ps5TotalCount: string;
  techFlag: string;
};

function toHankaku(str: string) {
  return str.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
}

function escapeHtml(str: string) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDiffColor(diff: string) {
  switch (diff) {
    case "Mas":
      return "#a259e6";
    case "Exp":
      return "#e0408a";
    case "Adv":
      return "#ff9800";
    case "Bas":
      return "#7ed957";
    case "Lun":
      return "#222";
    default:
      return "#293241";
  }
}

export default function Recommend() {
  const [id, setId] = useState("");
  const [excludeTech, setExcludeTech] = useState("no");
  const [loading, setLoading] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [ratingRange, setRatingRange] = useState<[number, number] | null>(null);
  const [tableHtml, setTableHtml] = useState("");
  const [recommendCount, setRecommendCount] = useState(30); // 選曲数オプション
  const tableRef = useRef<HTMLDivElement>(null);

  async function handleRecommend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResultImg(null);
    setTableHtml("");
    setPlayerName("");
    setRatingRange(null);

    let inputId = toHankaku(id.trim());
    if (!/^\d{1,5}$/.test(inputId)) {
      alert("OngekiScoreLog IDは半角数字1～5桁で入力してください");
      return;
    }
    setLoading(true);

    // ログ送信
    try {
      await fetch("/api/insertLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "おすすめ楽曲を選出",
          id,
          excludeTech,
          recommendCount,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (logError) {
      // ログ送信失敗時は無視
    }

    try {
      // 1. ローディング: OngekiScoreLogから情報を取得中...
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">OngekiScoreLogから情報を取得中...</span>
        </div>
      `);

      // 2. Next.js API経由でgetOngekiScoreLogDataを呼び出し
      const res = await fetch(`/api/scorelog?id=${inputId}`);
      const { html } = await res.json();

      // 3. HTMLからデータ抽出
      // --- プレイヤー名抽出 ---
      let playerName = "";
      try {
        const asideMatch = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/);
        if (asideMatch) {
          const asideHtml = asideMatch[1];
          const h1Match = asideHtml.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/);
          if (h1Match) {
            playerName = h1Match[1].replace(/<[^>]+>/g, "").trim();
          }
        }
      } catch (e) {
        playerName = "";
      }

      // --- Pスコアレーティング抽出 ---
      let pRating = "";
      try {
        const statMatch = html.match(/<article id="rating_statistics" class="box">([\s\S]*?)<\/article>/);
        if (statMatch) {
          const statHtml = statMatch[1];
          const tableMatch = statHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
          if (tableMatch) {
            const tableHtml = tableMatch[1];
            const trMatch = tableHtml.match(/<tr>([\s\S]*?)<\/tr>/);
            if (trMatch) {
              const trHtml = trMatch[1];
              const tdMatches = trHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
              if (tdMatches && tdMatches.length >= 2) {
                pRating = tdMatches[1].replace(/<[^>]+>/g, "").trim();
              }
            }
          }
        }
      } catch (e) {
        pRating = "";
      }

      // --- Pスコア枠情報抽出 ---
      let pMusics: any[] = [];
      try {
        const articleMatch = html.match(/<article id="rating_platinum" class="box">([\s\S]*?)<\/table>/);
        if (articleMatch) {
          const tableHtml = articleMatch[1] + "</table>";
          // テーブル行抽出
          const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
          let match;
          let number = 1;
          while ((match = trRegex.exec(tableHtml)) !== null) {
            try {
              const trHtml = match[1];
              const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
              let tdMatch;
              let tds: string[] = [];
              while ((tdMatch = tdRegex.exec(trHtml)) !== null) {
                tds.push(tdMatch[1]);
              }
              if (tds.length >= 7) {
                // 楽曲名
                let title = "";
                const aMatch = tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/);
                if (aMatch) {
                  title = aMatch[1].replace(/<[^>]+>/g, "").trim();
                }
                // 難易度
                let diff = tds[2].replace(/<[^>]+>/g, "").trim().toLowerCase();
                // レベル
                let lev = tds[3].replace(/<[^>]+>/g, "").trim();
                // rating
                let rating = "";
                const ratingSpanMatch =
                  tds[6].match(/<span[^>]*[\s\S]*?>([\s\S]*?)<\/span>/);
                if (ratingSpanMatch) {
                  rating = ratingSpanMatch[1].replace(/<[^>]+>/g, "").trim();
                }
                // star
                let star = null;
                const starText = tds[5].replace(/<[^>]+>/g, "").trim();
                if (starText !== "") {
                  star = parseInt(starText, 10);
                }
                pMusics.push({
                  number,
                  title,
                  diff,
                  lev,
                  star,
                  rating: rating ? parseFloat(rating) : null,
                });
                number++;
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        pMusics = [];
      }

      // 4. レスポンスチェック
      if (
        !playerName ||
        !pRating ||
        !Array.isArray(pMusics) ||
        pMusics.length === 0
      ) {
        setError(
          "情報の取得に失敗しました。\nIDが間違っている、またはOngekiScoreLogが未更新の可能性があります。\nお確かめの上、再度お試しください。"
        );
        setLoading(false);
        setTableHtml("");
        return;
      }

      setPlayerName(playerName);

      // 4. ローディング: おすすめ楽曲を選出中...
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">おすすめ楽曲を選出中...</span>
        </div>
      `);

      // 5. rating範囲
      const ratings = pMusics
        .map((r: any) => parseFloat(r.rating))
        .filter((r: any) => !isNaN(r));
      const minRating = Math.min(...ratings);
      const maxRating = Math.max(...ratings);

      // 6. data.json取得
      const dataRes = await fetch("/data/data.json");
      const data: SongRow[] = await dataRes.json();

      // 7. おすすめ対象曲抽出
      let filtered = data.filter((row) => {
        const ps5Rating = parseFloat(row.ps5Rating);
        return (
          !isNaN(ps5Rating) &&
          ps5Rating >= minRating + 0.050 &&
          ps5Rating <= maxRating
        );
      });

      // 8. テクチャレ除外
      if (excludeTech === "yes") {
        filtered = filtered.filter((x) => !x.techFlag || x.techFlag === "0");
      }

      // 9. Pスコア枠取得済み楽曲除外
      // starが5のもののみ除外
      const pscoreIds = pMusics
        .filter((x: any) => x.star === 5)
        .map((x: any) => `${x.title}|${x.diff}`);
        console.log("Pスコア枠除外対象:", pscoreIds);

      filtered = filtered.filter((row) => {
        let diffKey = "";
        if (row.difficulty) {
          const d = row.difficulty;
          // 先頭3文字を取得し、小文字にする
          diffKey = d.slice(0, 3).toLowerCase();
        }
        console.log("比較対象:", `${row.musicName}|${diffKey}`);
        return !pscoreIds.includes(`${row.musicName}|${diffKey}`);
      });

      // 10. ソロver除外
      filtered = filtered.filter(
        (row) => !(row.musicName && row.musicName.includes("ソロver"))
      );

      // 11. ソート
      filtered.sort((a, b) => {
        const starA = parseInt(a.ps5TotalCount) || 0;
        const starB = parseInt(b.ps5TotalCount) || 0;
        if (starA !== starB) return starB - starA;
        const constA = parseFloat(a.chartConst) || 0;
        const constB = parseFloat(b.chartConst) || 0;
        return constB - constA;
      });

      // 12. 選曲数で抽出
      const finalList = filtered.slice(0, recommendCount);

      // 13. ローディング: 画像を生成中...
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">画像を生成中...</span>
        </div>
      `);

      // 14. 画像生成
      setTimeout(async () => {
        // canvas生成
        const rowH = 38;
        const headerH = 120;
        const leftMargin = 18;
        const rightMargin = 18;
        // カラム幅割合: 1:6:2:2:1:2
        const colRatio = [1, 6, 2, 2, 1, 2];
        const totalRatio = colRatio.reduce((a, b) => a + b, 0);
        const tableW = 900;
        const colW = colRatio.map(r => Math.round((tableW - leftMargin - rightMargin) * r / totalRatio));
        const canvasW = tableW;
        const canvasH = headerH + rowH * finalList.length + 60;
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

        // タイトル
        ctx.font = "bold 28px 'Segoe UI',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#3d5a80";
        ctx.fillText("Pスコア枠おすすめ楽曲", leftMargin + (tableW - leftMargin - rightMargin) / 2, headerH / 2);

        // オプション表示（右上）
        ctx.save();
        ctx.font = "15px 'Segoe UI',sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = "#293241";
        const optX = canvasW - 24;
        let optY = 26;
        ctx.fillText("Generated Datetime: " + new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
        ctx.fillText("Player: " + playerName, optX, optY + 24);
        ctx.fillText("Rating: " + pRating, optX, optY + 48);
        ctx.fillText("Option: テクチャレ除外" + (excludeTech === "yes" ? "する" : "しない") + " / 選曲数" + recommendCount, optX, optY + 72);
        ctx.restore();

        // ヘッダー
        const headers = ["#", "Title", "Diff", "Lev(Const)", "☆5Count", "Expected Rising"];
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

        // 本体
        ctx.font = "15px 'Segoe UI',sans-serif";
        for (let r = 0; r < finalList.length; ++r) {
          let x = leftMargin;
          const item = finalList[r];

          // 順位
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[0], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[0], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.fillText(String(r + 1), x + colW[0] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[0] - 8);
          x += colW[0];

          // Title（色分け）
          let bgColor = "#fff";
          switch (item.difficulty) {
            case "MASTER": bgColor = "#f3e6fa"; break;
            case "EXPERT": bgColor = "#fde6f3"; break;
            case "ADVANCED": bgColor = "#fff2e0"; break;
            case "BASIC": bgColor = "#e6fae6"; break;
            case "LUNATIC": bgColor = "#f3f3f3"; break;
          }
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[1], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[1], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "left";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.musicName ?? "", x + 12, headerH + rowH * (r + 1) + rowH / 2, colW[1] - 24);
          x += colW[1];

          // Diff（色分け）
          let diffColor = "#293241";
          switch (item.difficulty) {
            case "MASTER": diffColor = "#a259e6"; break;
            case "EXPERT": diffColor = "#e0408a"; break;
            case "ADVANCED": diffColor = "#ff9800"; break;
            case "BASIC": diffColor = "#7ed957"; break;
            case "LUNATIC": diffColor = "#222"; break;
          }
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[2], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[2], rowH);
          ctx.fillStyle = diffColor;
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.difficulty ?? "", x + colW[2] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[2] - 8);
          x += colW[2];

          // Lev(Const)
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[3], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[3], rowH);
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
            x + colW[3] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[3] - 8
          );
          x += colW[3];

          // ☆5Count
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[4], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[4], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.ps5TotalCount ?? "", x + colW[4] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[4] - 8);
          x += colW[4];

          // Expected Rising
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[5], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[5], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          // 計算
          let rising = "+0.000";
          if (item.ps5Rating && !isNaN(Number(item.ps5Rating))) {
            const val = Math.round(((Number(item.ps5Rating) - minRating) / 50) * 10000) / 10000;
            rising = "+" + val.toFixed(3);
          }
          ctx.fillText(rising, x + colW[5] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[5] - 8);
        }

        setResultImg(canvas.toDataURL("image/png"));
        setTableHtml("");
        setLoading(false);
      }, 400);
    } catch (e) {
      setError("情報の取得に失敗しました。");
      setLoading(false);
      setTableHtml("");
    }
  }

  function handleSave() {
    if (!resultImg) return;
    // 画像保存・共有ログ送信
    try {
      fetch("/api/insertLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "画像保存・共有",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      // ログ送信失敗時は無視
    }
    try {
      const file = dataUrlToFile(resultImg, "ongeki_recommend.png");
      if (
        file &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        navigator.share({
          files: [file],
          title: "おすすめ楽曲表",
          text: "オンゲキおすすめ楽曲表",
        }).catch(() => {
          // 共有キャンセル時は何もしない
        });
      } else {
        // fallback: ダウンロード
        const a = document.createElement("a");
        a.href = resultImg;
        a.download = "ongeki_recommend.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      // 画像保存・共有処理エラーは無視
    }
  }

  function dataUrlToFile(dataUrl: string, filename: string) {
    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
      return new File([u8arr], filename, { type: mime });
    } catch {
      return null;
    }
  }

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
        <Title>Pスコア枠おすすめ曲選出</Title>
        {/* 説明文追加 */}
        <div style={{ color: "#293241", fontSize: "1.08em", margin: "1.2em 0 2.2em 0", lineHeight: "2" }}>
          OngekiScoreLogと連携し、Pスコア枠更新におすすめの楽曲を自動で選出します。
        </div>
        <form
          onSubmit={handleRecommend}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            marginBottom: 32,
            marginTop: 18,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", width: "100%", marginBottom: 18 }}>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 8 }}>
              <label htmlFor="scorelog-id" style={{ fontWeight: "bold", color: "#3d5a80", fontSize: "1rem", textAlign: "right", width: "100%" }}>
                OngekiScoreLog ID
              </label>
            </div>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingLeft: 8 }}>
              <input
                id="scorelog-id"
                type="text"
                value={id}
                onChange={(e) => setId(toHankaku(e.target.value))}
                maxLength={5}
                pattern="[0-9]{1,5}"
                style={{
                  padding: "10px 16px",
                  fontSize: "1rem",
                  border: "2px solid #98c1d9",
                  borderRadius: 8,
                  width: "100%",
                  maxWidth: 220,
                  background: "#e0fbfc",
                  color: "#293241",
                }}
                placeholder="半角数字1～5桁"
                required
              />
            </div>
          </div>
          <div style={{ display: "flex", width: "100%", marginBottom: 18 }}>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 8 }}>
              <label htmlFor="exclude-tech" style={{ fontWeight: "bold", color: "#3d5a80", fontSize: "1rem", textAlign: "right", width: "100%" }}>
                テクニカルチャレンジ対象曲を除外
              </label>
            </div>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingLeft: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, fontWeight: "bold", color: excludeTech === "yes" ? "#fff" : "#3d5a80", background: excludeTech === "yes" ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)" : "#f3f6fa", border: "1.5px solid #98c1d9", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="exclude-tech"
                    value="yes"
                    checked={excludeTech === "yes"}
                    onChange={() => setExcludeTech("yes")}
                    style={{ display: "none" }}
                  />
                  する
                </label>
                <label style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, fontWeight: "bold", color: excludeTech === "no" ? "#fff" : "#3d5a80", background: excludeTech === "no" ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)" : "#f3f6fa", border: "1.5px solid #98c1d9", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="exclude-tech"
                    value="no"
                    checked={excludeTech === "no"}
                    onChange={() => setExcludeTech("no")}
                    style={{ display: "none" }}
                  />
                  しない
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", width: "100%", marginBottom: 18 }}>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-end", paddingRight: 8 }}>
              <label htmlFor="recommend-count" style={{ fontWeight: "bold", color: "#3d5a80", fontSize: "1rem", textAlign: "right", width: "100%" }}>
                おすすめ楽曲数
              </label>
            </div>
            <div style={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "flex-start", paddingLeft: 8 }}>
              <input
                id="recommend-count"
                type="number"
                value={recommendCount}
                onChange={(e) => setRecommendCount(Math.max(1, Math.min(50, parseInt(e.target.value))))}
                min={1}
                max={50}
                style={{
                  padding: "10px 16px",
                  fontSize: "1rem",
                  border: "2px solid #98c1d9",
                  borderRadius: 8,
                  width: "100%",
                  maxWidth: 220,
                  background: "#e0fbfc",
                  color: "#293241",
                }}
                placeholder="1〜50"
                required
              />
            </div>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 0 }}>
            <button
              type="submit"
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
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span style={{
                    display: "inline-block",
                    width: 20,
                    height: 20,
                    border: "3px solid #bbb",
                    borderTop: "3px solid #3d5a80",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    verticalAlign: "middle",
                    marginRight: 8,
                  }} />
                  選出中...
                </span>
              ) : (
                "おすすめ楽曲を選出"
              )}
            </button>
          </div>
        </form>
        {error && (
          <div style={{ color: "#ee6c4d", marginBottom: 16, fontWeight: "bold" }}>{error}</div>
        )}
        <div ref={tableRef} dangerouslySetInnerHTML={{ __html: tableHtml }} />
        {resultImg && (
          <div style={{ textAlign: "center", margin: "2em 0" }}>
            <button
              onClick={handleSave}
              style={{
                padding: "10px 22px",
                fontSize: "1.05rem",
                fontWeight: "bold",
                color: "#fff",
                background: "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)",
                border: "none",
                borderRadius: 8,
                boxShadow: "0 2px 8px #98c1d933",
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              画像を保存・共有
            </button>
            <br />
            <img
              src={resultImg}
              alt="おすすめ楽曲表"
              style={{
                maxWidth: "100%",
                borderRadius: 8,
                boxShadow: "0 2px 8px #98c1d966",
                marginBottom: 16,
              }}
            />
            <br />
            <button
              onClick={handleSave}
              style={{
                padding: "10px 22px",
                fontSize: "1.05rem",
                fontWeight: "bold",
                color: "#fff",
                background: "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)",
                border: "none",
                borderRadius: 8,
                boxShadow: "0 2px 8px #98c1d933",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              画像を保存・共有
            </button>
          </div>
        )}
        <div style={{ margin: "2em 0 1em 0", color: "#293241", fontSize: "0.97em", lineHeight: 1.7 }}>
          <b>【注意事項】</b><br />
          ・選出には
          <a href="https://ongeki-score.net/" target="_blank" rel="noopener" style={{ color: "#3d5a80" }}>
            OngekiScoreLog様
          </a>
          の取得済みデータを使用します。未登録・更新状態が古い場合、正常に動作しません。<br />
          ・使用している譜面定数情報は
          <a href="https://ongeki-score.net/" target="_blank" rel="noopener" style={{ color: "#3d5a80" }}>
            OngekiScoreLog様
          </a>
          及び
          <a href="https://twitter.com/ongeki_level" target="_blank" rel="noopener" style={{ color: "#3d5a80" }}>
            オンゲキ譜面定数部様
          </a>
          の情報を参考にしています。<br />
          ・新曲及び10+以下のレベルの譜面定数に関して、情報が不足している場合正しく選出されない可能性があります。
          <br />
          <b>【選出仕様】</b><br />
          ・現在のPスコア枠を参考に、「☆5獲得でPスコア枠更新が見込める楽曲」を選出します。<br />
          ・おすすめ上位の楽曲は、☆5獲得人数が多い楽曲を優先して選出します。<br />
          ・オプション項目にて、テクニカルチャレンジ対象曲となったことのある楽曲を除外することができます。
        </div>
      </main>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </>
  );
}
