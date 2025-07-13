import Title from "@/components/Title";
import Header from "@/components/Header";

export default function Recommend() {
  return (
    <>
      <Header />
      <main style={{ padding: "64px 1rem 2rem 1rem", maxWidth: 700, margin: "0 auto" }}>
        <Title>Pスコア枠おすすめ曲選出</Title>
        <ul style={{ lineHeight: "2", color: "#293241", fontSize: "1rem" }}>
          <li>Pスコア枠におすすめの楽曲を自動で選出します。</li>
          <li>あなたの現在のスコアデータをもとに最適な楽曲を提案します。</li>
          <li>選出基準は達成率や難易度、人気度など多角的に分析しています。</li>
          <li>おすすめ楽曲は毎回最新のランキング情報を反映しています。</li>
          <li>苦手な譜面や得意な譜面も考慮して提案します。</li>
          <li>選出結果はワンタップでお気に入りに登録可能です。</li>
          <li>おすすめ理由もあわせて表示されます。</li>
          <li>スマートフォンでも見やすいデザインです。</li>
          <li>今後さらに精度向上や新機能追加を予定しています。</li>
          <li>ぜひ活用して自己ベスト更新を目指しましょう！</li>
        </ul>
      </main>
    </>
  );
}
