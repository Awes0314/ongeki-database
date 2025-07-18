import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

const SHEET_ID = "1GoDywxj0c2wjGpHUTi968ab1AR-XxaIN9klQdBX6OqQ";
const SHEET_NAME = "ログ"; // シート名を適宜変更

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { action, userAgent, timestamp, ...rest } = req.body;

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

    // 先頭行を挿入する
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            timestamp || new Date().toISOString(),
            action || "",
            userAgent || "",
            JSON.stringify(rest),
          ],
        ],
      },
    });

    res.status(200).json({ success: true });
  } catch (e: any) {
    console.error("🔥 API内部エラー:", e);
    res.status(500).json({ error: e.message });
  }
}
