import styles from "./AuthLayout.module.css";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className={styles.root}>
      <div className={styles.noise} />
      <div className={styles.grid} />
      <div className={styles.card}>
        <div className={styles.logoMark}>
          <span>S</span>
          <span>H</span>
          <span>P</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
