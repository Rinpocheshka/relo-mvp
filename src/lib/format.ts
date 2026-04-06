/**
 * Formats all numeric sequences within a string to include thousands separators (spaces).
 * Example: "1000000 vnd" -> "1 000 000 vnd"
 * Example: "от 50000 до 100000" -> "от 50 000 до 100 000"
 */
export function formatPrice(price: string | undefined | null): string {
  if (!price) return '';
  return price.replace(/\d+/g, (n) => 
    n.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  );
}
