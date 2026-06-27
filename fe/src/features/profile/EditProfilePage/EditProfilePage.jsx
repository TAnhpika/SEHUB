import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "@/common/Button/Button";
import UserAvatar from "@/common/UserAvatar/UserAvatar";
import { readStoredUser } from "@/context/AuthProvider";
import { useAuth } from "@/context";
import { useToast } from "@/common/Toast/ToastProvider";
import { resolveAssetUrl } from "@/api/assetUrl";
import * as profilesApi from "@/api/profilesApi";
import { loadProfileForm, saveMyProfile } from "@/features/profile/profileData";
import { GENDER_OPTIONS } from "@/features/profile/profileFormData";
import styles from "./EditProfilePage.module.css";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function EditProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!user || user.username !== username) return undefined;

    let cancelled = false;

    async function fetchForm() {
      setLoading(true);
      try {
        const data = await loadProfileForm(username, user);
        if (!cancelled) {
          setForm(data);
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err.message ?? "Không tải được thông tin profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchForm();
    return () => {
      cancelled = true;
    };
  }, [username, user, showToast]);

  if (!user || user.username !== username) {
    return <Navigate to={`/profile/${username}`} replace />;
  }

  if (loading || !form) {
    return (
      <div className={styles.page}>
        <p>Đang tải thông tin profile...</p>
      </div>
    );
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showToast("Ảnh đại diện phải là JPEG, PNG, WEBP hoặc GIF.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showToast("Ảnh đại diện tối đa 5 MB.");
      return;
    }

    if (USE_MOCK) {
      updateField("avatarUrl", URL.createObjectURL(file));
      return;
    }

    setAvatarUploading(true);
    try {
      const result = await profilesApi.uploadMyAvatar(file);
      const avatarUrl = resolveAssetUrl(result.avatarUrl);
      updateField("avatarUrl", avatarUrl);

      const stored = readStoredUser();
      if (stored) {
        localStorage.setItem(
          "sehubs_user",
          JSON.stringify({ ...stored, avatarUrl }),
        );
      }

      showToast("Đã cập nhật ảnh đại diện.");
    } catch (err) {
      showToast(err.message ?? "Không tải được ảnh đại diện.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    if (fullName.length < 2 || fullName.length > 50) {
      showToast("Họ và tên phải từ 2–50 ký tự.");
      return;
    }

    if (form.phone && !/^\d{10,15}$/.test(form.phone.trim())) {
      showToast("Số điện thoại phải có 10–15 chữ số.");
      return;
    }

    if (form.bio.length > 500) {
      showToast("Giới thiệu tối đa 500 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      await saveMyProfile(form);

      const stored = readStoredUser();
      if (stored) {
        localStorage.setItem(
          "sehubs_user",
          JSON.stringify({
            ...stored,
            displayName: fullName,
            avatarUrl: form.avatarUrl ?? stored.avatarUrl ?? null,
          }),
        );
      }

      showToast("Đã lưu thay đổi profile.");
      navigate(`/profile/${username}`);
    } catch (err) {
      showToast(err.message ?? "Không lưu được profile.");
    } finally {
      setSubmitting(false);
    }
  }

  const avatarPreview = form.avatarUrl;
  const avatarInitial = (form.fullName || user.displayName || user.initial).charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <Link to={`/profile/${username}`} className={styles.back}>
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại profile
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Chỉnh sửa profile</h1>
        <p className={styles.subtitle}>Cập nhật thông tin cá nhân của bạn</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles["section-title"]}>Ảnh đại diện</h2>
          <div className={styles["avatar-box"]}>
            <UserAvatar
              src={avatarPreview}
              initial={avatarInitial}
              className={styles.avatar}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_AVATAR_TYPES.join(",")}
              className={styles["avatar-input"]}
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
            <Button
              type="button"
              look="outline"
              disabled={avatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUploading ? "Đang tải ảnh..." : "Chọn ảnh đại diện"}
            </Button>
            <p className={styles.hint}>JPEG, PNG, WEBP hoặc GIF — tối đa 5 MB</p>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles["section-title"]}>Thông tin cá nhân</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input id="email" className={styles.input} value={form.email} disabled readOnly />
            <p className={styles.hint}>Email không thể thay đổi</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input id="username" className={styles.input} value={form.username} disabled readOnly />
            <p className={styles.hint}>Username không thể thay đổi</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullName">
              Họ và tên <span className={styles.required}>*</span>
            </label>
            <input
              id="fullName"
              className={styles.input}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              maxLength={50}
              required
            />
            <p className={styles.hint}>Họ và tên đầy đủ của bạn (2-50 ký tự)</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gender">
              Giới tính <span className={styles.required}>*</span>
            </label>
            <select
              id="gender"
              className={styles.select}
              value={form.gender}
              onChange={(event) => updateField("gender", event.target.value)}
              required
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="dateOfBirth">
              Ngày sinh
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className={styles.input}
              value={form.dateOfBirth}
              onChange={(event) => updateField("dateOfBirth", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              className={styles.input}
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              inputMode="numeric"
            />
            <p className={styles.hint}>10-15 chữ số</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="major">
              Chuyên ngành
            </label>
            <input
              id="major"
              className={styles.input}
              value={form.major}
              onChange={(event) => updateField("major", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="address">
              Địa chỉ
            </label>
            <input
              id="address"
              className={styles.input}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="bio">
              Giới thiệu bản thân
            </label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Viết vài dòng về bản thân..."
              maxLength={500}
              rows={4}
            />
            <p className={styles.hint}>Tối đa 500 ký tự</p>
          </div>
        </section>

        <div className={styles.actions}>
          <Button type="submit" disabled={submitting || avatarUploading}>
            Lưu thay đổi
          </Button>
          <Link to={`/profile/${username}`} className={styles.cancel}>
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}

export default EditProfilePage;
