import Title from "@/components/Title";
import Header from "@/components/Header";

export default function About() {
  return (
    <>
      <Header />
      <main style={{ padding: "64px 1rem 2rem 1rem", maxWidth: 700, margin: "0 auto" }}>
        <Title>このサイトについて</Title>
        <section style={{ color: "#293241", fontSize: "1rem", lineHeight: "2", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>サイトの概要</h2>
          <p>
            本サイトは、音楽ゲーム「オンゲキ（Ongeki）」に関連する楽曲情報を、見やすくまとめて表示するファン制作の情報サイトです。<br />
            プレイヤー向けの参考情報として、スプレッドシートを活用したDB表示や、おすすめ楽曲の自動抽出機能などを提供しています。
          </p>
          <p>
            今後も、オンゲキを楽しむプレイヤーさんたちにとって便利な情報サイトになることを目指して、個人でゆるやかに更新を続けていく予定です。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>利用させていただいているデータ</h2>
          <p>
            以下の公開データ・サイト様の情報をもとに構成しています（敬称略・順不同） :
          </p>
          <ul style={{ marginLeft: "1.5em" }}>
            <li>オンゲキ公式サイト（楽曲情報・ジャケット・難易度 等）</li>
            <li>OngekiScoreLog（スコア記録・達成率・定数情報 等）</li>
            <li>オンゲキ譜面定数部（譜面定数・難易度表 等）</li>
          </ul>
          <p>
            各種データの取得や整形は、公開された情報をもとに自動化処理を行っており、リアルタイム更新には対応していません。<br />
            また、誤情報・欠落がある可能性もあるため、あくまで参考用としてご利用ください。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>運営について</h2>
          <p>
            本サイトはオンゲキプレイヤーによる非公式・個人運営サイトです。<br />
            SEGA様をはじめとする公式運営会社様とは一切関係ありません。
          </p>
          <p>
            サイト内で使用している情報・数値・表現は、元となる公開データをもとに個人が整形・集計・加工したものであり、<br />
            ゲームの仕様変更や情報更新によって実際の内容と異なる場合があります。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>著作権について</h2>
          <p>
            当サイトで使用している文章・表現・データの一部は、公式サイトや各種情報サイト様の公開情報を元に構成していますが、<br />
            画像・音声など著作権保護対象となる素材は一切使用しておりません。<br />
            また、引用元や参考データがある場合は、可能な限り明示するよう努めています。
          </p>
          <p>
            掲載内容に問題がある場合や、修正・削除のご要望がある場合は、下記の連絡先までご連絡ください。
          </p>

          <h2 style={{ fontSize: "1.1em", fontWeight: "bold", marginTop: "2rem" }}>お問い合わせ</h2>
          <p>
            サイト運営に関するご意見・ご質問・修正依頼などは、以下のTwitterアカウントのDMまたはリプライにてご連絡ください。
          </p>
          <p>
            👉 Twitter:{" "}
            <a
              href="https://twitter.com/your_account_here"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3d5a80", fontWeight: "bold", textDecoration: "none" }}
            >
              @your_account_here
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
