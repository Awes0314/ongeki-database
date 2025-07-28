import { useRef, useState, useEffect } from "react";
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

  // 初期表示時ログ
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // fetch("/api/insertLog", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     action: "Pスコア枠おすすめ曲選出表示",
    //     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
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

  // オプション初期値 localStorageから取得
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("recommend-id");
    if (id !== null) setId(id);
    const count = localStorage.getItem("recommend-count");
    if (count !== null && !isNaN(Number(count))) setRecommendCount(Number(count));
    const tech = localStorage.getItem("recommend-tech-exclude");
    if (tech === "yes" || tech === "no") setExcludeTech(tech);
  }, []);

  async function handleRecommend(e: React.FormEvent) {
    e.preventDefault();
    // オプションをlocalStorageに保存
    if (typeof window !== "undefined") {
      localStorage.setItem("recommend-id", id);
      localStorage.setItem("recommend-count", String(recommendCount));
      localStorage.setItem("recommend-tech-exclude", excludeTech);
    }
    setError("");
    setResultImg(null);
    setTableHtml("");
    setPlayerName("");
    setRatingRange(null);

    // 0文字の場合は「1」をセット
    let inputId = toHankaku(id.trim());
    if (inputId.length === 0) {
      inputId = "1";
      setId("1");
      if (typeof window !== "undefined") {
        localStorage.setItem("recommend-id", "1");
      }
    }
    // おすすめ楽曲数が0文字の場合はエラー
    if (
      (recommendCount == 0)
    ) {
      alert("おすすめ楽曲数は1～100の半角数字で入力してください");
      return;
    }
    if (!/^\d{1,5}$/.test(inputId)) {
      alert("OngekiScoreLog IDは半角数字0～5桁で入力してください");
      return;
    }
    setLoading(true);

    // ログ送信
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
          action: "おすすめ楽曲を選出",
          option: optionStr,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          timestamp: new Date().toISOString(),
          userId,
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

      // プレイヤー名をlocalStorageに保存
      if (typeof window !== "undefined" && playerName) {
        localStorage.setItem("user-name", playerName);
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

      filtered = filtered.filter((row) => {
        let diffKey = "";
        if (row.difficulty) {
          const d = row.difficulty;
          // 先頭3文字を取得し、小文字にする
          diffKey = d.slice(0, 3).toLowerCase();
        }
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
        const rowH = 28; // databaseと同じ
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

        // サイトロゴ描画（左上端）
        const logoX = leftMargin;
        const logoY = 18;
        const logoW = 130;
        const logoH = 44;
        // 背景（丸みあり）
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

        // オプション表示（右上）
        ctx.save();
        ctx.font = "15px 'Segoe UI',sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = "#293241";
        const optX = canvasW - 24;
        let optY = 26;
        ctx.fillText(new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
        ctx.fillText("Player: " + playerName, optX, optY + 24);
        ctx.fillText("Rating: " + pRating, optX, optY + 48);
        ctx.fillText("Opt.: テクチャレ" + (excludeTech === "yes" ? "除外する" : "除外しない") + " / 選曲数 " + recommendCount, optX, optY + 72);
        ctx.restore();

        // ヘッダー
        const headers = ["#", "Title", "Diff", "Lev(Const)", "☆5Count", "Expected Rising"];
        let x = leftMargin;
        ctx.font = "bold 16px 'Segoe UI',sans-serif"; // databaseと同じ
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
        ctx.font = "15px 'Segoe UI',sans-serif"; // databaseと同じ
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
          ctx.font = "bold 15px 'Segoe UI',sans-serif"; // databaseと同じ
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
          ctx.font = "bold 15px 'Segoe UI',sans-serif"; // databaseと同じ
          ctx.fillText(item.difficulty ?? "", x + colW[2] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[2] - 8);
          x += colW[2];

          // Lev(Const)
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[3], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[3], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "15px 'Segoe UI',sans-serif"; // databaseと同じ
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
          ctx.font = "bold 15px 'Segoe UI',sans-serif"; // databaseと同じ
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

  // おすすめ楽曲数 入力ハンドラ
  function handleRecommendCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = toHankaku(e.target.value.replace(/[^0-9０-９]/g, ""));
    if (val === "") {
      setRecommendCount(0);
      return;
    }
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 1;
    num = Math.max(1, Math.min(100, num));
    setRecommendCount(num);
  }

  function handleSave() {
    if (!resultImg) return;

    // ログ送信（非同期で投げっぱなしOK）
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
    fetch("/api/insertLog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "おすすめ曲画像保存・共有",
        option: optionStr,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
        userId,
      }),
    }).catch(() => {
      // ログ送信失敗時は無視
    });

    try {
      const file = dataUrlToFile(resultImg, "ongeki_recommend.png");

      // 共有が使えるかどうかチェック
      const canUseShare = typeof navigator.canShare === "function" &&
                          navigator.canShare({ files: [file] });

      if (canUseShare && typeof navigator.share === "function") {
        navigator.share({
          files: [file],
          title: "おすすめ楽曲表",
          text: "オンゲキおすすめ楽曲表",
        }).catch(() => {
          // ユーザーがキャンセルした場合など、何もしない
        });
      } else {
        // fallback: 通常の画像ダウンロード
        const a = document.createElement("a");
        a.href = resultImg;
        a.download = "ongeki_recommend.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      // 画像処理や保存での例外は無視（silent fail）
    }
  }


  function dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  }


  // sp判定
  const [isSp, setIsSp] = useState(false);
  useEffect(() => {
    const check = () => setIsSp(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        <Title>
          {isSp ? (
            <>
              Pスコア枠<br />おすすめ曲選出
            </>
          ) : (
            <>Pスコア枠おすすめ曲選出</>
          )}
        </Title>
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
          {/* OngekiScoreLog ID */}
          <div style={{
            display: "flex",
            width: "100%",
            marginBottom: 18,
            alignItems: "center",
          }}>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingRight: 8,
              justifyContent: "center",
              height: "100%",
              textAlign: "right", // 右詰め
            }}>
              <label htmlFor="scorelog-id" style={{
                fontWeight: "bold",
                color: "#3d5a80",
                fontSize: "1rem",
                textAlign: "right",
                width: "100%",
                display: "flex",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end", // 右詰め
              }}>
                OngekiScoreLog ID
              </label>
            </div>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: 8,
              justifyContent: "center",
              height: "100%",
            }}>
              <input
                id="scorelog-id"
                type="text"
                value={id}
                onChange={(e) => {
                  // 6文字以上入力不可
                  let v = toHankaku(e.target.value).replace(/[^0-9]/g, "");
                  if (v.length > 5) v = v.slice(0, 5);
                  setId(v);
                }}
                maxLength={5}
                pattern="[0-9]{0,5}"
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
                placeholder="半角数字0～5桁"
                required
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>
          {/* テクチャレ除外 */}
          <div style={{
            display: "flex",
            width: "100%",
            marginBottom: 18,
            alignItems: "center",
          }}>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingRight: 8,
              justifyContent: "center",
              height: "100%",
              textAlign: "right", // 右詰め
            }}>
              <label htmlFor="exclude-tech" style={{
                fontWeight: "bold",
                color: "#3d5a80",
                fontSize: "1rem",
                textAlign: "right",
                width: "100%",
                display: "flex",
                alignItems: "center",
                height: "100%",
                whiteSpace: "pre-line",
                justifyContent: "flex-end", // 右詰め
              }}>
                {isSp ? "テクニカルチャレンジ\n対象曲を除外" : "テクニカルチャレンジ対象曲を除外"}
              </label>
            </div>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: 8,
              justifyContent: "center",
              height: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontWeight: "bold",
                  color: excludeTech === "yes" ? "#fff" : "#3d5a80",
                  background: excludeTech === "yes"
                    ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)"
                    : "#f3f6fa",
                  border: "1.5px solid #98c1d9",
                  cursor: "pointer"
                }}>
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
                <label style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontWeight: "bold",
                  color: excludeTech === "no" ? "#fff" : "#3d5a80",
                  background: excludeTech === "no"
                    ? "linear-gradient(90deg, #3d5a80 0%, #98c1d9 100%)"
                    : "#f3f6fa",
                  border: "1.5px solid #98c1d9",
                  cursor: "pointer"
                }}>
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
          {/* おすすめ楽曲数 */}
          <div style={{
            display: "flex",
            width: "100%",
            marginBottom: 18,
            alignItems: "center",
          }}>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingRight: 8,
              justifyContent: "center",
              height: "100%",
              textAlign: "right", // 右詰め
            }}>
              <label htmlFor="recommend-count" style={{
                fontWeight: "bold",
                color: "#3d5a80",
                fontSize: "1rem",
                textAlign: "right",
                width: "100%",
                display: "flex",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end", // 右詰め
              }}>
                おすすめ楽曲数
              </label>
            </div>
            <div style={{
              width: "48%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: 8,
              justifyContent: "center",
              height: "100%",
            }}>
              <input
                id="recommend-count"
                type="text"
                inputMode="numeric"
                pattern="[0-9０-９]{0,3}"
                value={recommendCount === 0 ? "" : recommendCount}
                onChange={handleRecommendCountChange}
                min={1}
                max={100}
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
                placeholder="1〜100"
                required
                autoComplete="off"
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
          ・オプション項目にて、テクニカルチャレンジ対象曲となったことのある楽曲を除外することができます。<br />
          ・「Expected Rising」は、☆5獲得時に見込める上昇レーティング想定値です。
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
