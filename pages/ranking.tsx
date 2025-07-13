import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Title from "@/components/Title";
import Header from "@/components/Header";

export default function Ranking() {
  const [message, setMessage] = useState<string>("読み込み中...");

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, "musics", "test_document");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setMessage(data.test_field || "データはあるけど test_field が見つからない！");
      } else {
        setMessage("ドキュメントが存在しないよ！");
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <Header />
      <main style={{ padding: "64px 1rem 2rem 1rem", maxWidth: 700, margin: "0 auto", color: "#293241", fontSize: "1rem" }}>
        <Title>理論値ランキング</Title>
        <p>{message}</p>
      </main>
    </>
  );
}
