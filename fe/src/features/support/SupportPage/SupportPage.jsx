import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faClock,
  faCommentDots,
  faEnvelope,
  faFileArrowUp,
  faMagnifyingGlass,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import supportIllustration from "@/img/support-illustration.png";
import {
  FAQ_ITEMS,
  SUPPORT_CATEGORIES,
  SUPPORT_SUBJECTS,
} from "./supportData";
import styles from "./SupportPage.module.css";

function SupportPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      !search.trim() ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleFaq(index) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="support-hero-title">
        <div className={styles["hero-inner"]}>
          <div className={styles["hero-copy"]}>
            <h1 id="support-hero-title" className={styles["hero-title"]}>
              Trung tâm hỗ trợ <span className={styles.accent}>SEHub</span>
            </h1>
            <p className={styles["hero-desc"]}>
              Tìm câu trả lời, gửi yêu cầu hỗ trợ và nhận trợ giúp nhanh chóng từ đội ngũ
              chuyên gia của chúng tôi.
            </p>
            <label className={styles.search}>
              <FontAwesomeIcon icon={faMagnifyingGlass} className={styles["search-icon"]} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm câu hỏi hoặc vấn đề..."
                aria-label="Tìm kiếm câu hỏi hoặc vấn đề"
              />
            </label>
          </div>

          <div className={styles["hero-visual"]}>
            <img
              src={supportIllustration}
              alt="Minh họa trung tâm hỗ trợ SEHub"
              className={styles["hero-illustration-img"]}
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className={styles.categories} aria-labelledby="categories-title">
        <div className={styles.wrap}>
          <h2 id="categories-title" className={styles["section-title"]}>
            Danh mục hỗ trợ
          </h2>
          <div className={styles["category-grid"]}>
            {SUPPORT_CATEGORIES.map((item) => (
              <article key={item.title} className={styles["category-card"]}>
                <span className={styles["category-icon"]}>
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <h3 className={styles["category-name"]}>{item.title}</h3>
                <p className={styles["category-desc"]}>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={styles.faq} aria-labelledby="faq-title">
        <div className={styles.wrap}>
          <h2 id="faq-title" className={styles["section-title"]}>
            Câu hỏi phổ biến
          </h2>
          <div className={styles["faq-list"]}>
            {filteredFaqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.question} className={styles["faq-item"]}>
                  <button
                    type="button"
                    className={styles["faq-trigger"]}
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{item.question}</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`${styles["faq-chevron"]} ${isOpen ? styles["faq-chevron-open"] : ""}`}
                    />
                  </button>
                  {isOpen && <p className={styles["faq-answer"]}>{item.answer}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className={styles.request} aria-labelledby="request-title">
        <div className={styles.wrap}>
          <h2 id="request-title" className={styles["section-title"]}>
            Gửi yêu cầu hỗ trợ
          </h2>

          <div className={styles["request-grid"]}>
            <aside className={styles["contact-card"]}>
              <h3 className={styles["contact-title"]}>Thông tin liên hệ</h3>

              <div className={styles["contact-item"]}>
                <span className={styles["contact-icon"]}>
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <div>
                  <p className={styles["contact-label"]}>Email hỗ trợ</p>
                  <a href="mailto:support@sehub.vn" className={styles["contact-value"]}>
                    support@sehub.vn
                  </a>
                </div>
              </div>

              <div className={styles["contact-item"]}>
                <span className={styles["contact-icon"]}>
                  <FontAwesomeIcon icon={faCommentDots} />
                </span>
                <div>
                  <p className={styles["contact-label"]}>Discord Server</p>
                  <a
                    href="https://discord.gg/BBeTyn6Heh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["contact-value"]}
                  >
                    discord.gg/BBeTyn6Heh
                  </a>
                </div>
              </div>

              <div className={styles["contact-item"]}>
                <span className={styles["contact-icon"]}>
                  <FontAwesomeIcon icon={faClock} />
                </span>
                <div>
                  <p className={styles["contact-label"]}>Thời gian phản hồi</p>
                  <span className={styles["contact-value"]}>
                    Trong vòng 24 giờ (Thứ 2 – Thứ 6)
                  </span>
                </div>
              </div>
            </aside>

            <form
              className={styles["form-card"]}
              onSubmit={(event) => event.preventDefault()}
            >
              <div className={styles["form-row"]}>
                <label className={styles.field}>
                  <span className={styles.label}>Họ và tên</span>
                  <input type="text" placeholder="Nguyễn Văn A" />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input type="email" placeholder="email@example.com" />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Chủ đề</span>
                <select defaultValue="">
                  <option value="" disabled>
                    Chọn chủ đề cần hỗ trợ
                  </option>
                  {SUPPORT_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Mô tả chi tiết</span>
                <textarea
                  rows={4}
                  placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                />
              </label>

              <div className={styles.field}>
                <span className={styles.label}>Đính kèm tệp (Tùy chọn)</span>
                <div className={styles.upload}>
                  <FontAwesomeIcon icon={faFileArrowUp} className={styles["upload-icon"]} />
                  <p className={styles["upload-text"]}>
                    Kéo thả tập vào đây hoặc <span>chọn tệp</span>
                  </p>
                  <p className={styles["upload-hint"]}>Hỗ trợ JPG, PNG, PDF (Max 5MB)</p>
                </div>
              </div>

              <Button type="submit" fullWidth className={styles["submit-btn"]}>
                Gửi yêu cầu
                <FontAwesomeIcon icon={faPaperPlane} />
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles["cta-inner"]}>
          <h2 id="cta-title" className={styles["cta-title"]}>
            Không tìm thấy câu trả lời?
          </h2>
          <p className={styles["cta-desc"]}>
            Cộng đồng của chúng tôi luôn sẵn sàng hỗ trợ. Đừng ngần ngại liên hệ hoặc thảo
            luận cùng mọi người.
          </p>
          <div className={styles["cta-actions"]}>
            <Button to="/community" className={styles["cta-btn-light"]}>
              Tham gia cộng đồng
            </Button>
            <a href="#contact" className={styles["cta-btn-outline"]}>
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportPage;
