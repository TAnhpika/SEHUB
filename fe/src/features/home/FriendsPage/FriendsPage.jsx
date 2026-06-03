import styles from "./FriendsPage.module.css";

function FriendsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tìm kiếm bạn bè</h1>
        <p className={styles.subtitle}>Kết nối với sinh viên FPT cùng chuyên ngành</p>
      </header>

      <div className={styles.empty}>
        <p>Tính năng đang được phát triển — sẽ có trong bản cập nhật tiếp theo.</p>
      </div>
    </div>
  );
}

export default FriendsPage;
