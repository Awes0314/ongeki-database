import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Head from "next/head";
import Script from "next/script";

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let uid = localStorage.getItem("user-id");
    if (!uid) {
      uid = generateUUID();
      localStorage.setItem("user-id", uid);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Pongeki オンゲキ Pスコア情報管理サイト</title>
        <meta
          name="description"
          content="Pongekiは、オンゲキ（O.N.G.E.K.I.）のPスコア・理論値・☆獲得人数などのランキングやおすすめ楽曲選出など、プレイヤーのための集計・分析情報を提供する非公式ファンサイトです。オンゲキの楽曲別データベースや自動おすすめ機能も搭載。データはオンゲキ-NETやOngekiScoreLog等の公開情報を元にしています。"
        />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf-8" />
        <meta
          property="og:title"
          content="Pongeki オンゲキ Pスコア情報管理サイト"
        />
        <meta
          property="og:description"
          content="オンゲキのPスコア・理論値・☆獲得人数などのランキングやおすすめ楽曲選出など、プレイヤーのための集計・分析情報を提供する非公式ファンサイトです。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ongeki-db.awesomes.jp/" />
        <meta property="og:site_name" content="Pongeki" />
        <meta property="og:image" content="/ogp.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Pongeki オンゲキ Pスコア情報管理サイト"
        />
        <meta
          name="twitter:description"
          content="オンゲキのPスコア・理論値・☆獲得人数などのランキングやおすすめ楽曲選出など、プレイヤーのための集計・分析情報を提供する非公式ファンサイトです。"
        />
        <meta name="twitter:image" content="/ogp.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://ongeki-db.awesomes.jp/" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
