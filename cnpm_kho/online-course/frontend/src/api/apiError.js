/**
 * Reads the backend ErrorResponse { status, message, errors? } into something a form can display.
 * fieldErrors maps a field name to its message (only for 400 validation errors).
 */
export function parseApiError(error) {
  if (!error.response) {
    return { message: 'Không kết nối được tới server. Kiểm tra backend đã chạy chưa.', fieldErrors: {} };
  }
  const data = error.response.data || {};
  return {
    message: data.message || 'Đã có lỗi xảy ra, vui lòng thử lại.',
    fieldErrors: data.errors || {},
  };
}
