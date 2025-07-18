import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/Header.module.css";

const menuLinks = [
  { href: "/", label: "トップページ" },
  { href: "/database", label: "ランキング情報一覧" },
  { href: "/recommend", label: "Pスコア枠おすすめ曲選出" },
  { href: "/ranking", label: "理論値ランキング" },
  { href: "/about", label: "このサイトについて" },
];

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null); // ボタン用ref
  const router = useRouter();

  // スクロール時ロゴ背景
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // メニュー外クリックで閉じる（buttonも除外）
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false); // アニメーション付きで閉じる
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // メニュー開時はbodyスクロール不可
  useEffect(() => {
    if (open) {
      setMenuVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const timer = setTimeout(() => setMenuVisible(false), 300); // アニメーション後に非表示
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ルートが"/"ならハンバーガー非表示
  const isTop = router.pathname === "/";

  // ページ遷移時にメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  // ハンバーガーボタン押下時
  const handleMenuBtnClick = () => {
    if (open) {
      // アニメーション付きで閉じる
      setOpen(false);
    } else {
      setMenuVisible(true);
      setTimeout(() => setOpen(true), 10); // 少し遅延させて開く
    }
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.logo} ${scrolled ? styles.logoScrolled : ""}`}>
        <Link href="/" aria-label="ホーム">
          <span className={styles.logoP}>P</span>
        </Link>
      </div>
      {/* index以外のみハンバーガー */}
      {!isTop && (
        <>
          <button
            ref={buttonRef}
            className={`${styles.menuBtn} ${scrolled ? styles.menuBtnScrolled : ""} ${open ? styles.menuBtnOpen : ""}`}
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={open}
            onClick={handleMenuBtnClick}
            type="button"
          >
            <span className={`${styles.menuIcon} ${open ? styles.menuIconOpen : ""} ${scrolled || open ? styles.menuIconScrolled : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
          <div
            ref={menuRef}
            className={`${styles.spMenu} ${open ? styles.spMenuOpen : ""} ${menuVisible ? styles.spMenuVisible : ""}`}
            tabIndex={-1}
            aria-hidden={!open}
          >
            <nav className={styles.spMenuNav}>
              {menuLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.spMenuLink}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
