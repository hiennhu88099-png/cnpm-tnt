// Phân trang. page tính từ 0 (giống backend); hiển thị cho người dùng tính từ 1.
// Hiện trang đầu, trang cuối và 1 trang mỗi bên trang hiện tại; phần bị lược thay bằng "…".
function pageItems(page, totalPages) {
  const pages = new Set([0, totalPages - 1, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < totalPages).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push(`gap-${p}`);
    items.push(p);
  });
  return items;
}

export default function Pagination({ page, totalPages, onChange, disabled }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page === 0}
      >
        Trước
      </button>

      {pageItems(page, totalPages).map((item) =>
        typeof item === 'string' ? (
          <span key={item} className="pagination-gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className="pagination-btn"
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Trang ${item + 1}`}
            onClick={() => onChange(item)}
            disabled={disabled || item === page}
          >
            {item + 1}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages - 1}
      >
        Sau
      </button>
    </nav>
  );
}
