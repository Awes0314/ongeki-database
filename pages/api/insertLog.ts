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
    // yyyymmdd
    const jstDate = new Date(jst.getTime() + 9 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyymmdd = `${jstDate.getFullYear()}${pad(jstDate.getMonth() + 1)}${pad(jstDate.getDate())}`;
    const sheetName = yyyymmdd;

    // シート一覧取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      includeGridData: false,
    });
    const sheetList = spreadsheet.data.sheets?.map(s => s.properties?.title) ?? [];

    // シートがなければ追加
    if (!sheetList.includes(sheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });
      // 1行目にヘッダー追加
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: sheetName,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["datetime", "action", "userAgent", "userId", "option"]
          ],
        },
      });
    }

    // 既存データ取得
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: sheetName,
    });
    const rows = getRes.data.values || [];
    // 2行目以降にデータがある場合、1行目はヘッダー
    const isHeader = rows.length > 0 && rows[0][0] === "datetime";
    const newRow = [
      jstStr,
      action || "",
      userAgent || "",
      userId || "",
      option || "",
    ];
    if (isHeader) {
      rows.splice(1, 0, newRow); // ヘッダーの直後に追加
    } else {
      rows.unshift(newRow);
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: sheetName,
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
