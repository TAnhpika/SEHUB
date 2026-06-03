import { useEffect, useRef, useState } from "react";
import styles from "./ForgotPasswordPage.module.css";

const OTP_LENGTH = 6;

/**
 * @param {{
 *   value: string;
 *   onChange: (value: string) => void;
 *   disabled?: boolean;
 * }} props
 */
function OtpInput({ value, onChange, disabled = false }) {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  useEffect(() => {
    if (!disabled) {
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    }
  }, [disabled]);

  function focusInput(index) {
    inputRefs.current[index]?.focus();
  }

  function updateDigit(index, digit) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, OTP_LENGTH));
  }

  function handleChange(index, event) {
    const raw = event.target.value.replace(/\D/g, "");

    if (!raw) {
      updateDigit(index, "");
      return;
    }

    if (raw.length === 1) {
      updateDigit(index, raw);
      if (index < OTP_LENGTH - 1) {
        focusInput(index + 1);
      }
      return;
    }

    const pasted = raw.slice(0, OTP_LENGTH - index);
    const next = digits.slice();

    for (let offset = 0; offset < pasted.length; offset += 1) {
      next[index + offset] = pasted[offset];
    }

    onChange(next.join("").slice(0, OTP_LENGTH));
    focusInput(Math.min(index + pasted.length, OTP_LENGTH - 1));
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function getCellClassName(index) {
    if (focusedIndex === index || digits[index]) {
      return `${styles["otp-cell"]} ${styles["otp-cell-active"]}`;
    }

    return styles["otp-cell"];
  }

  return (
    <div className={styles["otp-grid"]} role="group" aria-label="Nhập mã OTP 6 chữ số">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          className={getCellClassName(index)}
          value={digit}
          disabled={disabled}
          aria-label={`Chữ số ${index + 1}`}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={() => setFocusedIndex(index)}
        />
      ))}
    </div>
  );
}

export default OtpInput;
