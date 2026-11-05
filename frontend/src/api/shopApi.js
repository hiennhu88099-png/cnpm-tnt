import client from './client';

export const shopApi = {
  // Public Vouchers & Banners
  getPublicVouchers: () => client.get('/api/vouchers').then((r) => r.data),
  getPublicBanners: () => client.get('/api/banners').then((r) => r.data),

  // Admin Vouchers
  getAdminVouchers: () => client.get('/api/admin/vouchers').then((r) => r.data),
  createVoucher: (data) => client.post('/api/admin/vouchers', data).then((r) => r.data),
  updateVoucher: (id, data) => client.put(`/api/admin/vouchers/${id}`, data).then((r) => r.data),
  toggleVoucher: (id) => client.patch(`/api/admin/vouchers/${id}/toggle`).then((r) => r.data),
  deleteVoucher: (id) => client.delete(`/api/admin/vouchers/${id}`).then((r) => r.data),

  // Admin Banners
  getAdminBanners: () => client.get('/api/admin/banners').then((r) => r.data),
  createBanner: (data) => client.post('/api/admin/banners', data).then((r) => r.data),
  updateBanner: (id, data) => client.put(`/api/admin/banners/${id}`, data).then((r) => r.data),
  toggleBanner: (id) => client.patch(`/api/admin/banners/${id}/toggle`).then((r) => r.data),
  deleteBanner: (id) => client.delete(`/api/admin/banners/${id}`).then((r) => r.data),

  // Learner Wishlist
  getWishlist: () => client.get('/api/wishlists').then((r) => r.data),
  toggleWishlist: (courseId) => client.post(`/api/wishlists/${courseId}/toggle`).then((r) => r.data),
  removeWishlist: (courseId) => client.delete(`/api/wishlists/${courseId}`).then((r) => r.data),

  // Learner Cart
  getCart: () => client.get('/api/cart').then((r) => r.data),
  addToCart: (courseId) => client.post(`/api/cart/${courseId}`).then((r) => r.data),
  removeFromCart: (courseId) => client.delete(`/api/cart/${courseId}`).then((r) => r.data),
  clearCart: () => client.delete('/api/cart').then((r) => r.data),

  // Orders & Checkout
  getPaymentConfig: () => client.get('/api/payment/config').then((r) => r.data),
  createPendingOrder: (data) => client.post('/api/orders/pending', data).then((r) => r.data),
  checkoutOrder: (data) => client.post('/api/orders/checkout', data).then((r) => r.data),
  getOrderStatus: (orderCode) =>
    client.get(`/api/orders/${encodeURIComponent(orderCode)}/status`).then((r) => r.data),
  getMyOrders: () => client.get('/api/orders/my').then((r) => r.data),
  getAdminOrders: () => client.get('/api/admin/orders').then((r) => r.data),
};

