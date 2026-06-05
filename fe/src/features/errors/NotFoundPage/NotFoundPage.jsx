import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faHouse } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import { useAuth } from "@/context";
import logoSrc from "@/img/logo.png";
import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? "/home" : "/";

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <Button look="soft" size="sm" to={homePath} className={styles.brand}>
          <img src={logoSrc} alt="" className={styles.logo} decoding="async" aria-hidden="true" />
          SEHub
        </Button>
      </header>

      <main className={styles.main}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>Không tìm thấy trang</h1>
        <p className={styles.desc}>
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển. Hãy quay lại trang chủ
          hoặc thử đường dẫn khác.
        </p>

        <div className={styles.actions}>
          <Button look="solid" size="lg" to={homePath}>
            <FontAwesomeIcon icon={faHouse} />
            Về trang chủ
          </Button>
          <Button look="outline" size="lg" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Quay lại
          </Button>
        </div>
      </main>
    </div>
  );
}

export default NotFoundPage;
