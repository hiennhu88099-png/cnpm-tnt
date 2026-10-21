import { useCallback, useEffect, useState } from 'react';
import { parseApiError } from '../api/apiError';

/**
 * Gọi API khi component mở và mỗi khi `fetcher` đổi (bọc fetcher bằng useCallback với đúng dependency).
 *   const { data, error, loading, reload } = useApiQuery(useCallback(() => api.get(id), [id]));
 *
 * - data giữ kết quả cũ trong lúc tải lại -> danh sách không bị nháy trắng khi đổi trang/bộ lọc.
 * - error chỉ có giá trị khi lần gọi gần nhất thất bại.
 * - "loading" được suy ra (fetcher hiện tại chưa có kết quả) thay vì setState đồng bộ trong effect.
 */
export default function useApiQuery(fetcher) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState({ source: null, reloadCount: -1, data: undefined, error: null });

  useEffect(() => {
    let ignore = false;
    fetcher().then(
      (data) => {
        if (!ignore) setState({ source: fetcher, reloadCount, data, error: null });
      },
      (err) => {
        const error = { ...parseApiError(err), status: err.response?.status ?? null };
        if (!ignore) setState((prev) => ({ source: fetcher, reloadCount, data: prev.data, error }));
      },
    );
    return () => {
      ignore = true;
    };
  }, [fetcher, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const loading = state.source !== fetcher || state.reloadCount !== reloadCount;

  return {
    data: state.data,
    // { message, fieldErrors, status } của lần gọi gần nhất, null nếu thành công / đang tải lại
    error: loading ? null : state.error,
    loading,
    reload,
  };
}
