"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function PasswordField({
  id,
  label,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input">
        <input
          {...inputProps}
          id={inputId}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="password-input__toggle"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? (
            <svg
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9 5 9 5a17.4 17.4 0 0 1-3.1 3.5M6.6 6.6C4.3 8.1 3 10 3 10s3.5 5 9 5a10.8 10.8 0 0 0 3-.4" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
