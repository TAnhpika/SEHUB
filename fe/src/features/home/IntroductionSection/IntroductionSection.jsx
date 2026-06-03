import styles from "./IntroductionSection.module.css";

function IntroductionSection({ introduction }) {
  const content =
    introduction?.trim() || "Phần giới thiệu của bạn hiện đang trống.";

  return (
    <section className={styles.panel}>
      <h2 className={styles.title}>Giới thiệu</h2>
      <p className={styles.content}>{content}</p>
    </section>
  );
}

export default IntroductionSection;
