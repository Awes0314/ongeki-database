import Title from "@/components/Title";
import Header from "@/components/Header";
import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    fetch("/api/insertLog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "このサイトについて表示",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      }),
    });
  }, []);

  return (
    <>
      <Header />
      <main style={{ padding: "64px 1rem 2rem 1rem", maxWidth: 700, margin: "0 auto" }}>
        <Title>このサイトについて</Title>
        <section style={{ color: "#293241", fontSize: "1rem", lineHeight: "2", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>サイトの概要</h2>
          <p>
            本サイトは、音楽ゲーム「オンゲキ（Ongeki）」に関する楽曲情報を、見やすく整理して提供するファンメイドの情報サイトです。<br />
            プレイヤーの参考になるよう、スプレッドシートを活用したデータベース表示や、おすすめ楽曲の自動抽出機能などを備えています。
          </p>
          <p>
            今後もオンゲキを楽しむプレイヤーの皆さまにとって便利な情報サイトを目指して、個人の趣味としてゆるやかに更新を続けていく予定です。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>使用しているデータについて</h2>
          <p>
            以下の公開情報やサイト様のデータをもとに構成しています（敬称略・順不同）：
          </p>
          <ul style={{ marginLeft: "1.5em" }}>
            <li>オンゲキ公式サイト（楽曲情報・ジャケット・難易度 など）</li>
            <li>OngekiScoreLog（スコア記録・達成率・定数情報 など）</li>
            <li>オンゲキ譜面定数部（譜面定数・難易度表 など）</li>
          </ul>
          <p>
            データの取得や整形は自動化処理によって行っており、リアルタイムでの更新には対応していません。<br />
            また、誤情報や不足が含まれる可能性もあるため、あくまで参考情報としてご利用ください。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>運営について</h2>
          <p>
            本サイトはオンゲキプレイヤーによる非公式・個人運営のサイトです。<br />
            SEGA様などの公式運営会社様とは一切関係ありません。
          </p>
          <p>
            掲載している情報・数値・表現は、公開データを元に個人が整形・集計・加工したものであり、<br />
            ゲームの仕様変更や情報更新により、実際の内容と異なる場合があります。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>著作権について</h2>
          <p>
            本サイトで使用している文章やデータの一部は、公式サイトや各種情報サイト様の公開情報を元に構成しています。<br />
            ただし、画像や音声などの著作権保護対象となる素材は一切使用しておりません。<br />
            また、引用元や参考元がある場合は、できる限り明記するよう努めています。
          </p>
          <p>
            万が一掲載内容に問題がある場合や、修正・削除のご要望がある際は、下記の連絡先までご連絡ください。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>お問い合わせ</h2>
          <p>
            サイト運営に関するご意見・ご質問・修正依頼などは、以下のTwitterアカウントのDMまたはリプライにてご連絡ください。
          </p>
          <p>
            👉 Twitter:{" "}
            <a
              href="https://twitter.com/Extra_Awes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3d5a80", fontWeight: "bold", textDecoration: "none" }}
            >
              @Extra_Awes
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
