import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import Title from "@/components/Title";
import Card from "@/components/Card";
import styles from "@/styles/Home.module.css";
import Link from "next/link";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // ページ表示時ログ
    // fetch("/api/insertLog", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     action: "トップページ表示",
    //     userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
  }, []);

  // リンク押下時ログ
  function handleCardClick(action: string) {
    // ログ送信なし
  }

  return (
    <>
      <Head>
        <title>オンゲキ Pスコア情報管理</title>
        <meta name="description" content="オンゲキPスコア情報管理サイト" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          <Title>
            Pongeki
            <br />
            <span
              style={{
                fontWeight: "normal",
                fontSize: "1.1rem",
                color: "#293241",
              }}
            >
              オンゲキ Pスコア情報管理サイト
            </span>
          </Title>
          <div className={styles.cardList}>
            <Card
              href="/database"
              title="☆獲得人数一覧"
              description="各楽曲の☆獲得人数を一覧で確認できます。"
              imageSrc="/index_database.png"
              onClick={() => handleCardClick("☆獲得人数一覧リンク")}
            />
            <Card
              href="/recommend"
              title="Pスコア枠おすすめ曲選出"
              description="Pスコア枠におすすめの楽曲を自動で選出します。"
              imageSrc="/index_recommend.png"
              onClick={() => handleCardClick("Pスコア枠おすすめ曲選出リンク")}
            />
            <Card
              href="/ranking"
              title="理論値ランキング"
              description="楽曲ごとの理論値ランキングを確認できます。"
              imageSrc="/index_ranking.png"
              onClick={() => handleCardClick("理論値ランキングリンク")}
            />
            <Card
              href="/map"
              title="アドベンチャーマップ"
              description="オンゲキアドベンチャーマップの情報を確認できます。"
              imageSrc="/index_map.png"
              onClick={() => handleCardClick("アドベンチャーマップリンク")}
            />
          </div>
          <div className={styles.aboutLink}>
            <Link
              href="/about"
              onClick={() => handleCardClick("このサイトについてリンク")}
            >
              このサイトについて
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}