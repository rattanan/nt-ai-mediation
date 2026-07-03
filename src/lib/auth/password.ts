import { appBaseUrl } from "@/lib/auth/verification";

export const passwordResetRedirectUrl = `${appBaseUrl}/reset-password`;

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("ต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("ต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("ต้องมีตัวเลขอย่างน้อย 1 ตัว");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
