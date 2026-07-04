export type FormValues = Record<string, string>;

export type FormState = {
  error?: string;
  success?: string;
  values?: FormValues;
};

export const emptyFormState: FormState = {};

export function formDataToValues(formData: FormData): FormValues {
  const values: FormValues = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION_") || value instanceof File) {
      continue;
    }

    values[key] = String(value);
  }

  return values;
}

export function formError(formData: FormData, error: string): FormState {
  return {
    error,
    values: formDataToValues(formData),
  };
}
