/** brand_name → slug: minúsculas, sem acento, [a-z0-9-]. Compartilhado entre onboarding e configurações. */
export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "produto";
}
