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
  const router = useRouter();

  // スクロール時ロゴ背景
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
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
      // メニューを閉じる時はアニメーション後に非表示
      const timer = setTimeout(() => setMenuVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ルートが"/"ならハンバーガー非表示
  const isTop = router.pathname === "/";

  // メニュー遷移時に閉じる
  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  // ハンバーガーボタン押下時の処理
  const handleMenuBtnClick = () => {
    if (open) {
      // 閉じる: open=false（アニメーション後にmenuVisible=false）
      setOpen(false);
    } else {
      // 開く: menuVisible=true→open=true
      setMenuVisible(true);
      setTimeout(() => setOpen(true), 10); // 少し遅延してopen
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

