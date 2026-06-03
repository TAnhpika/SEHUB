import styles from "./MessagesPage.module.css";

function MessagesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nhắn tin</h1>
        <p className={styles.subtitle}>Danh sách hội thoại sẽ hiển thị tại đây.</p>
      </header>
    </div>
  );
}

export default MessagesPage;
