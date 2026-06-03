const PROFILE_FORM_STORAGE_KEY = "sehubs_profile_form";

export const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export const DEFAULT_PROFILE_FORM = {
  email: "anhcoding12345@gmail.com",
  username: "anhcoding12345",
  fullName: "Nguyễn Văn A",
  gender: "other",
  dateOfBirth: "",
  phone: "0123456789",
  major: "Software Engineering",
  address: "Hà Nội, Việt Nam",
  bio: "",
};

function readStoredForms() {
  try {
    const raw = localStorage.getItem(PROFILE_FORM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getProfileFormData(username, overrides = {}) {
  const stored = readStoredForms()[username];
  return {
    ...DEFAULT_PROFILE_FORM,
    username,
    email: overrides.email ?? DEFAULT_PROFILE_FORM.email,
    ...stored,
  };
}

export function saveProfileFormData(username, data) {
  const all = readStoredForms();
  all[username] = data;
  localStorage.setItem(PROFILE_FORM_STORAGE_KEY, JSON.stringify(all));
}
