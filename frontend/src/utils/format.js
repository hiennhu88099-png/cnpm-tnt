const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

// 399000 -> "399.000 ₫", 0 -> "Miễn phí"
export function formatPrice(value) {
  if (value == null) return '';
  return Number(value) === 0 ? 'Miễn phí' : currency.format(value);
}

// "2026-10-11T15:00:00" -> "11/10/2026"
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
}

// 1157 -> "1.157"
export function formatNumber(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}
