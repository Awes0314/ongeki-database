export const runtime = 'nodejs';

import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const SHEET_ID = "1GoDywxj0c2wjGpHUTi968ab1AR-XxaIN9klQdBX6OqQ";
const SHEET_NAME = "ログ"; // シート名を適宜変更

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  // 受け取る: action, userAgent, timestamp, userId, option
  const {
    action,
    userAgent,
    timestamp,
    userId,
    option
  } = req.body;

  try {
    // Google認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // 日本時間
    const jst = new Date();
    const jstStr = new Date(jst.getTime() + 9 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z$/, "");

    // 1行目に追加（既存データを取得して先頭に新規行を追加して上書き）
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
    });
    const rows = getRes.data.values || [];
    const newRow = [
      jstStr,
      action || "",
      userAgent || "",
      userId || "",
      option || "",
    ];
    rows.unshift(newRow);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: "RAW",
      requestBody: {
        values: rows,
      },
    });

    res.status(200).json({ success: true });
  } catch (e: any) {
    console.error("🔥 API内部エラー:", e);
    res.status(500).json({ error: e.message });
  }
}
