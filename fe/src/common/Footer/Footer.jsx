import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faComments,
  faEnvelope,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import logoSrc from "@/img/logo.png";
import styles from "./Footer.module.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles["brand-col"]}>
            <Link to="/" className={styles["footer-brand"]}>
              <img src={logoSrc} alt="" className={styles["footer-logo"]} decoding="async" aria-hidden="true" />
              <span className={styles["footer-brand-text"]}>SEHub</span>
            </Link>
            <p className={styles["brand-slogan"]}>
              Kiến tạo tương lai công nghệ cho sinh viên SE.
            </p>
            <div className={styles.social}>
              <span className={styles["social-btn"]} aria-label="Website">
                <FontAwesomeIcon icon={faGlobe} />
              </span>
              <span className={styles["social-btn"]} aria-label="Cộng đồng">
                <FontAwesomeIcon icon={faComments} />
              </span>
              <span className={styles["social-btn"]} aria-label="Email">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
            </div>
          </div>

          <div className={styles["link-col"]}>
            <p className={styles["col-title"]}>Sản phẩm</p>
            <ul className={styles["link-list"]}>
              <li>
                <span>Khóa học</span>
              </li>
              <li>
                <a href="/#features">AI Trợ giảng</a>
              </li>
              <li>
                <a href="/#features">Kho đề thi</a>
              </li>
              <li>
                <a href="/#community">Gói Premium</a>
              </li>
            </ul>
          </div>

          <div className={styles["link-col"]}>
            <p className={styles["col-title"]}>Cộng đồng</p>
            <ul className={styles["link-list"]}>
              <li>
                <Link to="/community">Diễn đàn</Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/BBeTyn6Heh"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>

          <div className={styles["link-col"]}>
            <p className={styles["col-title"]}>Hỗ trợ</p>
            <ul className={styles["link-list"]}>
              <li>
                <Link to="/support">Trung tâm trợ giúp</Link>
              </li>
              <li>
                <Link to="/support#contact">Liên hệ</Link>
              </li>
              <li>
                <Link to="/support#faq">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className={styles.newsletter}>
            <p className={styles["col-title"]}>Đăng ký nhận tin</p>
            <p className={styles["newsletter-desc"]}>
              Nhận thông báo về tài liệu và kỹ năng mới nhất.
            </p>
            <form
              className={styles["newsletter-form"]}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                className={styles["newsletter-input"]}
                placeholder="Email của bạn"
                aria-label="Email đăng ký nhận tin"
              />
              <button
                type="submit"
                className={styles["newsletter-submit"]}
                aria-label="Gửi đăng ký"
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </form>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} SEHub. All rights reserved.
          </p>
          <div className={styles["bottom-links"]}>
            <button type="button" className={styles["bottom-link"]}>
              Điều khoản
            </button>
            <button type="button" className={styles["bottom-link"]}>
              Bảo mật
            </button>
            <button type="button" className={`${styles["bottom-link"]} ${styles.lang}`}>
              <FontAwesomeIcon icon={faGlobe} />
              Tiếng Việt
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
