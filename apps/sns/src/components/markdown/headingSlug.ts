export function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`'"!@#$%^&*()_+=[\]{};:\\|,.<>/?~]/g, "")
    .replace(/\s+/g, "-");
}

