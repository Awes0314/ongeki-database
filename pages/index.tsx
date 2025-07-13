import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import Title from "@/components/Title";
import Card from "@/components/Card";
import styles from "@/styles/Home.module.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <>
      <Head>
        <title>オンゲキ Pスコア情報管理</title>
        <meta name="description" content="オンゲキPスコア情報管理サイト" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          <Title>オンゲキ Pスコア情報管理サイト</Title>
          <div className={styles.cardList}>
            <Card
              href="/database"
              title="☆獲得人数一覧"
              description="各楽曲の☆獲得人数を一覧で確認できます。"
              imageSrc="/index_database.png"
            />
            <Card
              href="/recommend"
              title="Pスコア枠おすすめ曲選出"
              description="Pスコア枠におすすめの楽曲を自動で選出します。"
              imageSrc="/index_recommend.png"
            />
            <Card
              href="/ranking"
              title="理論値ランキング"
              description="楽曲ごとの理論値ランキングを確認できます。"
              imageSrc="/index_ranking.png"
            />
          </div>
          <div className={styles.aboutLink}>
            <Link href="/about">このサイトについて</Link>
          </div>
        </main>
      </div>
    </>
  );
}