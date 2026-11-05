import { useState } from 'react';
import {
  AdminTableSkeleton,
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  PageHeader,
} from '../components/ui';
import { formatDate, formatNumber, formatPrice } from '../utils/format';
import { useShopStore } from '../utils/shopStore';

const EMPTY_FORM = {
  id: '',
  code: '',
  type: 'percent',
  value: 20,
  maxDiscount: 100000,
  minOrderAmount: 0,
  description: '',
  endDate: '2026-12-31',
  active: true,
};

export default function AdminVoucherPage() {
  const { vouchers, vouchersLoading, saveVoucher, toggleVoucherActive, deleteVoucher } =
    useShopStore();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState({ type: 'success', text: '' });

  const filtered = vouchers.filter((v) => {
    if (filterStatus === 'ACTIVE' && !v.active) return false;
    if (filterStatus === 'INACTIVE' && v.active) return false;
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      return (
        v.code.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = vouchers.filter((v) => v.active).length;
  const inactiveCount = vouchers.length - activeCount;

  function openCreateModal() {
    setFormData(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(voucher) {
    setFormData({
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount || 0,
      minOrderAmount: voucher.minOrderAmount || 0,
      description: voucher.description || '',
      endDate: voucher.endDate || '2026-12-31',
      active: voucher.active !== false,
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      setFormError('Mã giảm giá cần tối thiểu 3 ký tự (VD: EDUHUB50).');
      return;
    }
    if (Number(formData.value) <= 0) {
      setFormError('Giá trị giảm phải lớn hơn 0.');
      return;
    }
    if (formData.type === 'percent' && Number(formData.value) > 100) {
      setFormError('Mức giảm theo phần trăm không được vượt quá 100%.');
      return;
    }

    const duplicate = vouchers.find(
      (v) => v.code === code && v.id !== formData.id,
    );
    if (duplicate) {
      setFormError(`Mã "${code}" đã tồn tại trong hệ thống.`);
      return;
    }

    saveVoucher({ ...formData, code });
    setModalOpen(false);
    setNotice({
      type: 'success',
      text: formData.id
        ? `Đã cập nhật mã giảm giá ${code}.`
        : `Đã tạo mã giảm giá mới ${code}. Học viên có thể sử dụng ngay ở trang Thanh toán.`,
    });
  }

  function handleDelete(voucher) {
    if (!window.confirm(`Xóa vĩnh viễn mã giảm giá "${voucher.code}"?`)) return;
    deleteVoucher(voucher.id);
    setNotice({ type: 'success', text: `Đã xóa mã giảm giá ${voucher.code}.` });
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị khuyến mãi"
        title="Quản lý Mã giảm giá (Voucher)"
        subtitle="Tạo, điều chỉnh điều kiện áp dụng và bật/tắt các mã ưu đãi trên trang Thanh toán."
        actions={
          <Button onClick={openCreateModal}>
            <Icon name="plus" size={16} /> Thêm mã giảm giá
          </Button>
        }
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      {/* 3 Thẻ thống kê nhanh */}
      <div className="nx-dash-breakdown-grid">
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Tổng số mã ưu đãi</div>
          <div className="nx-dash-stat-value">{formatNumber(vouchers.length)}</div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang kích hoạt</div>
          <div className="nx-dash-stat-value" style={{ color: '#059669' }}>
            {formatNumber(activeCount)}
          </div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang tạm dừng</div>
          <div className="nx-dash-stat-value" style={{ color: '#d97706' }}>
            {formatNumber(inactiveCount)}
          </div>
        </div>
      </div>

      <Card>
        <div className="nx-filter-pills" role="tablist" aria-label="Lọc mã giảm giá">
          {[
            { value: 'ALL', label: `Tất cả (${vouchers.length})` },
            { value: 'ACTIVE', label: `Đang hoạt động (${activeCount})` },
            { value: 'INACTIVE', label: `Tạm dừng (${inactiveCount})` },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`nx-filter-pill${filterStatus === tab.value ? ' is-active' : ''}`}
              onClick={() => setFilterStatus(tab.value)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <div className="catalog-search">
            <label htmlFor="admin-voucher-search" className="sr-only">
              Tìm kiếm mã giảm giá
            </label>
            <input
              id="admin-voucher-search"
              className="input"
              type="search"
              placeholder="Tìm theo mã code hoặc mô tả..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        {vouchersLoading ? (
          <AdminTableSkeleton rows={4} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="Không có mã giảm giá phù hợp"
            description="Bạn có thể tạo mã giảm giá mới để thu hút học viên đăng ký khóa học."
            action={<Button onClick={openCreateModal}>Thêm mã giảm giá</Button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Mã Voucher</th>
                  <th scope="col">Loại ưu đãi</th>
                  <th scope="col">Mức giảm</th>
                  <th scope="col">Đơn tối thiểu</th>
                  <th scope="col">Hạn sử dụng</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="nx-th-actions">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="cell-title" style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {v.code}
                      </div>
                      <div className="cell-sub">{v.description}</div>
                    </td>
                    <td>
                      <Badge variant={v.type === 'percent' ? 'primary' : 'neutral'}>
                        {v.type === 'percent' ? 'Theo %' : 'Số tiền cố định'}
                      </Badge>
                    </td>
                    <td>
                      <strong>
                        {v.type === 'percent'
                          ? `${v.value}% (Tối đa ${formatPrice(v.maxDiscount || 0)})`
                          : formatPrice(v.value)}
                      </strong>
                    </td>
                    <td>{formatPrice(v.minOrderAmount || 0)}</td>
                    <td>{formatDate(v.endDate)}</td>
                    <td>
                      <Badge variant={v.active ? 'success' : 'warning'}>
                        {v.active ? 'Đang kích hoạt' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(v)}
                          className="nx-action-btn is-edit"
                        >
                          <Icon name="pen" size={14} />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleVoucherActive(v.id)}
                          className={`nx-action-btn ${v.active ? 'is-warning' : 'is-success'}`}
                        >
                          <Icon name="power" size={14} />
                          <span>{v.active ? 'Tắt' : 'Bật'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
                          className="nx-action-btn is-danger"
                        >
                          <Icon name="trash" size={14} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal tạo / chỉnh sửa Voucher */}
      {modalOpen && (
        <div
          className="voucher-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={formData.id ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
          onClick={() => setModalOpen(false)}
        >
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <div>
                <h3 className="voucher-modal-title">
                  {formData.id ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}
                </h3>
                <p className="voucher-modal-sub">
                  Đồng bộ trực tiếp với danh sách Voucher ở trang Thanh toán
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="voucher-modal-close"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="admin-voucher-form">
              <Alert variant="error">{formError}</Alert>

              <div className="admin-voucher-form-grid">
                <div>
                  <label className="field-label">Mã Code *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="VD: SUMMER2026"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Hình thức giảm *</label>
                  <select
                    className="input"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percent">Giảm theo phần trăm (%)</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">
                    {formData.type === 'percent' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: Number(e.target.value) })
                    }
                    required
                  />
                </div>

                {formData.type === 'percent' && (
                  <div>
                    <label className="field-label">Giảm tối đa (VNĐ)</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: Number(e.target.value) })
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Đơn tối thiểu (VNĐ)</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <label className="field-label">Hạn sử dụng</label>
                  <input
                    className="input"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Mô tả ưu đãi *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="VD: Giảm 50.000đ cho đơn đăng ký từ 150.000đ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="admin-voucher-form-actions">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {formData.id ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

