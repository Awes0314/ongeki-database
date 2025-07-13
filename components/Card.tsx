import React from "react";
import Link from "next/link";
import styles from "@/styles/Card.module.css";

type Props = {
  href: string;
  title: string;
  description: string;
  imageSrc?: string;
  preview?: React.ReactNode;
};

const Card: React.FC<Props> = ({ href, title, description, imageSrc, preview }) => (
  <Link href={href} className={styles.card}>
    <div className={styles.cardInner}>
      <div className={styles.cardText}>
        <div className={styles.cardHeader}>
          <h2>{title}</h2>
        </div>
        <p className={styles.cardDesc}>{description}</p>
        {preview && <div className={styles.cardPreview}>{preview}</div>}
      </div>
      {imageSrc && (
        <div className={styles.cardImageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={title} className={styles.cardImage} />
        </div>
      )}
    </div>
  </Link>
);

export default Card;
