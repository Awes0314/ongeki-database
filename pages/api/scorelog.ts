export const runtime = 'edge';

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string" || !/^\d{1,5}$/.test(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const response = await fetch(`https://ongeki-score.net/user/${id}/rating`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Next.js)",
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch" });
      return;
    }

    const html = await response.text();
    res.status(200).json({ html });
  } catch (e) {
    // console.error("Fetch error:", e);
    res.status(500).json({ error: "Unexpected error during fetch" });
  }
}