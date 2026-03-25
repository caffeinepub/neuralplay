export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatPriceShort(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}k`;
  }
  return `₹${rupees.toFixed(0)}`;
}
