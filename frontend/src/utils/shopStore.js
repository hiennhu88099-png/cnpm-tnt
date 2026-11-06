import { useEffect, useState } from 'react';
import { tokenStorage } from '../api/client.js';
import { shopApi } from '../api/shopApi.js';

const WISHLIST_KEY = 'eduhub_wishlist_v1';
const CART_KEY = 'eduhub_cart_v1';
const VOUCHERS_KEY = 'eduhub_vouchers_v2';
const SAVED_VOUCHERS_KEY = 'eduhub_saved_vouchers_v1';
const BANNERS_KEY = 'eduhub_banners_v2';
const CHANGE_EVENT = 'eduhub-shop-change';

try {
  localStorage.removeItem('eduhub_banners_v1');
  localStorage.removeItem('eduhub_vouchers_v1');
} catch {
  // ignore
}

const DEFAULT_BANNERS = [
  {
    id: 1,
    title: 'Siêu Hội Học Tập EduHub 2026 - Ưu đãi đến 50%',
    imageUrl: '/banners/hero-main-1.svg',
    link: '/courses',
    type: 'HomeMain',
    position: 1,
    active: true,
  },
  {
    id: 2,
    title: 'Combo Lập Trình & AI - Tiết kiệm đến 150.000đ',
    imageUrl: '/banners/promo-left.svg',
    link: '/courses',
    type: 'Promo',
    position: 2,
    active: true,
  },
  {
    id: 3,
    title: 'Kho Khóa Học Miễn Phí 0đ - Học thử không giới hạn',
    imageUrl: '/banners/side-right-1.svg',
    link: '/courses',
    type: 'Side',
    position: 3,
    active: true,
  },
  {
    id: 4,
    title: 'Ưu đãi 50% Khóa học Fullstack & AI',
    imageUrl: '/banners/float-left.svg',
    link: '/courses',
    type: 'FloatLeft',
    position: 4,
    active: true,
  },
  {
    id: 5,
    title: 'Nhập mã EDUHUB50 giảm ngay 50.000đ',
    imageUrl: '/banners/float-right.svg',
    link: '/cart',
    type: 'FloatRight',
    position: 5,
    active: true,
  },
];

const DEFAULT_VOUCHERS = [
  {
    id: 1,
    code: 'NEWSTUDENT',
    type: 'percent',
    value: 20,
    maxDiscount: 100000,
    minOrderAmount: 0,
    description: 'Ưu đãi 20% (tối đa 100K) dành cho học viên đăng ký khóa học mới',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 2,
    code: 'EDUHUB50',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderAmount: 150000,
    description: 'Giảm trực tiếp 50.000đ cho đơn đăng ký khóa học từ 150.000đ',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 3,
    code: 'FULLSTACK100',
    type: 'fixed',
    value: 100000,
    maxDiscount: 100000,
    minOrderAmount: 400000,
    description: 'Giảm 100.000đ cho các khóa học chuyên sâu từ 400.000đ',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 4,
    code: 'COMBO150K',
    type: 'fixed',
    value: 150000,
    maxDiscount: 150000,
    minOrderAmount: 600000,
    description: 'Giảm 150.000đ khi mua combo nhiều khóa học từ 600.000đ',
    endDate: '2026-12-31',
    active: true,
  },
];

const memoryCache = {};

function readJson(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(memoryCache, key)) {
    return memoryCache[key];
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    memoryCache[key] = parsed;
    return parsed;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  memoryCache[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Nếu ảnh base64 quá lớn vượt quota 5MB của localStorage, xóa bản cũ trong localStorage và giữ nguyên trong memoryCache + Backend DB
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

function normalizeCourseItem(course) {
  return {
    id: Number(course.id),
    title: course.title || `Khóa học #${course.id}`,
    price: Number(course.price ?? 0),
    originalPrice: Number(course.originalPrice ?? 0),
    thumbnail: course.thumbnail || '',
    instructorName: course.instructorName || '',
    categoryName: course.categoryName || '',
    level: course.level || '',
    lessonCount: course.lessonCount ?? course.lessons?.length ?? null,
    averageRating: course.averageRating ?? null,
    reviewCount: course.reviewCount ?? 0,
  };
}

function normalizeVoucherItem(v) {
  return {
    id: v.id,
    code: String(v.code || '').toUpperCase(),
    type: v.type === 'percent' ? 'percent' : 'fixed',
    value: Number(v.value ?? 0),
    maxDiscount: Number(v.maxDiscount ?? 0),
    minOrderAmount: Number(v.minOrderAmount ?? 0),
    description: v.description || '',
    endDate: v.endDate || '2026-12-31',
    active: v.active !== false,
  };
}

function normalizeBannerItem(b) {
  return {
    id: b.id,
    title: b.title || 'Banner khuyến mãi',
    imageUrl: b.imageUrl || '/banners/hero-main-1.svg',
    link: b.link || '/courses',
    type: b.type || 'HomeMain',
    position: Number(b.position) || 1,
    active: b.active !== false,
  };
}

// --- BACKEND SYNC ---
let lastSyncKey = null;
let syncInFlight = false;
let bannersLoaded = false;
let vouchersLoaded = false;

function compressDataUrlIfNeeded(dataUrl) {
  return new Promise((resolve) => {
    if (
      typeof dataUrl !== 'string' ||
      !dataUrl.startsWith('data:image/') ||
      dataUrl.startsWith('data:image/svg') ||
      dataUrl.length < 300 * 1024
    ) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      const maxWidth = 1600;
      const maxHeight = 900;
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}

async function optimizeOversizedBannersInCache(banners) {
  const hasOversized = banners.some(
    (b) =>
      typeof b.imageUrl === 'string' &&
      b.imageUrl.startsWith('data:image/') &&
      !b.imageUrl.startsWith('data:image/svg') &&
      b.imageUrl.length >= 250 * 1024
  );
  if (!hasOversized) return;

  const optimized = await Promise.all(
    banners.map(async (b) => {
      const nextUrl = await compressDataUrlIfNeeded(b.imageUrl);
      if (nextUrl !== b.imageUrl) {
        const updated = { ...b, imageUrl: nextUrl };
        const numId = Number(b.id);
        if (tokenStorage.get() && Number.isFinite(numId) && numId > 0) {
          shopApi.updateBanner(numId, updated).catch(() => {});
        }
        return updated;
      }
      return b;
    })
  );
  writeJson(BANNERS_KEY, optimized);
}

export async function syncShopFromBackend(force = false) {
  const token = tokenStorage.get() || '';
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const currentKey = `${token}:${isAdminPath ? 'admin' : 'pub'}`;

  if (syncInFlight && !force) return;
  if (!force && lastSyncKey === currentKey && lastSyncKey !== null) return;

  syncInFlight = true;
  lastSyncKey = currentKey;

  try {
    const [vouchersRes, bannersRes] = await Promise.all([
      (token && isAdminPath ? shopApi.getAdminVouchers() : shopApi.getPublicVouchers()).catch(() => null),
      (token && isAdminPath ? shopApi.getAdminBanners() : shopApi.getPublicBanners()).catch(() => null),
    ]);

    if (Array.isArray(vouchersRes)) {
      vouchersLoaded = true;
      writeJson(VOUCHERS_KEY, vouchersRes.map(normalizeVoucherItem));
    } else if (!vouchersLoaded) {
      vouchersLoaded = true;
      if (!readJson(VOUCHERS_KEY, null)) {
        writeJson(VOUCHERS_KEY, DEFAULT_VOUCHERS);
      } else if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
    }
    if (Array.isArray(bannersRes)) {
      bannersLoaded = true;
      const normalized = bannersRes.map(normalizeBannerItem);
      writeJson(BANNERS_KEY, normalized);
      optimizeOversizedBannersInCache(normalized);
    } else if (!bannersLoaded) {
      bannersLoaded = true;
      if (!readJson(BANNERS_KEY, null)) {
        writeJson(BANNERS_KEY, DEFAULT_BANNERS);
      } else if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
    }

    if (token) {
      const [wishRes, cartRes] = await Promise.all([
        shopApi.getWishlist().catch(() => null),
        shopApi.getCart().catch(() => null),
      ]);
      if (Array.isArray(wishRes)) {
        writeJson(WISHLIST_KEY, wishRes.map(normalizeCourseItem));
      }
      if (Array.isArray(cartRes)) {
        writeJson(CART_KEY, cartRes.map(normalizeCourseItem));
      }
    }
  } finally {
    syncInFlight = false;
  }
}

// --- WISHLIST ---
export function getWishlist() {
  return readJson(WISHLIST_KEY, []);
}

export function isInWishlist(courseId) {
  const id = Number(courseId);
  return getWishlist().some((item) => Number(item.id) === id);
}

export function toggleWishlist(course) {
  const list = getWishlist();
  const id = Number(course.id);
  const exists = list.some((item) => Number(item.id) === id);
  const next = exists
    ? list.filter((item) => Number(item.id) !== id)
    : [normalizeCourseItem(course), ...list];
  writeJson(WISHLIST_KEY, next);

  if (tokenStorage.get()) {
    shopApi.toggleWishlist(id).catch(() => {});
  }
  return !exists;
}

export function removeFromWishlist(courseId) {
  const id = Number(courseId);
  const next = getWishlist().filter((item) => Number(item.id) !== id);
  writeJson(WISHLIST_KEY, next);

  if (tokenStorage.get()) {
    shopApi.removeWishlist(id).catch(() => {});
  }
}

// --- SHOPPING CART ---
export function getCart() {
  return readJson(CART_KEY, []);
}

export function isInCart(courseId) {
  const id = Number(courseId);
  return getCart().some((item) => Number(item.id) === id);
}

export function addToCart(course) {
  const list = getCart();
  const id = Number(course.id);
  if (list.some((item) => Number(item.id) === id)) {
    return false;
  }
  const next = [...list, normalizeCourseItem(course)];
  writeJson(CART_KEY, next);

  if (tokenStorage.get()) {
    shopApi.addToCart(id).catch(() => {});
  }
  return true;
}

export function removeFromCart(courseId) {
  const id = Number(courseId);
  const next = getCart().filter((item) => Number(item.id) !== id);
  writeJson(CART_KEY, next);

  if (tokenStorage.get()) {
    shopApi.removeFromCart(id).catch(() => {});
  }
}

export function removeMultipleFromCart(courseIds = []) {
  const idSet = new Set(courseIds.map((id) => Number(id)));
  const next = getCart().filter((item) => !idSet.has(Number(item.id)));
  writeJson(CART_KEY, next);

  if (tokenStorage.get()) {
    courseIds.forEach((cid) => {
      shopApi.removeFromCart(Number(cid)).catch(() => {});
    });
  }
}

export function clearCart() {
  writeJson(CART_KEY, []);
  if (tokenStorage.get()) {
    shopApi.clearCart().catch(() => {});
  }
}

// --- VOUCHERS ---
export function getAllVouchers() {
  const saved = readJson(VOUCHERS_KEY, null);
  if (!Array.isArray(saved)) {
    return vouchersLoaded ? DEFAULT_VOUCHERS : [];
  }
  return saved;
}

export function getActiveVouchers() {
  const today = new Date().toISOString().slice(0, 10);
  return getAllVouchers().filter((v) => v.active !== false && (!v.endDate || v.endDate >= today));
}

export function saveVoucher(voucherInput) {
  const list = getAllVouchers();
  const code = String(voucherInput.code || '').trim().toUpperCase();
  const isNumericId = voucherInput.id && !Number.isNaN(Number(voucherInput.id));
  const payload = {
    id: voucherInput.id || `v_${Date.now()}`,
    code,
    type: voucherInput.type === 'percent' ? 'percent' : 'fixed',
    value: Math.max(1, Number(voucherInput.value) || 0),
    maxDiscount: Number(voucherInput.maxDiscount) || 0,
    minOrderAmount: Math.max(0, Number(voucherInput.minOrderAmount) || 0),
    description: String(voucherInput.description || '').trim(),
    endDate: voucherInput.endDate || '2026-12-31',
    active: voucherInput.active !== false,
  };

  const existingIdx = list.findIndex((item) => String(item.id) === String(payload.id));
  const next =
    existingIdx >= 0
      ? list.map((item, idx) => (idx === existingIdx ? payload : item))
      : [payload, ...list];

  writeJson(VOUCHERS_KEY, next);

  if (tokenStorage.get()) {
    const reqCall = isNumericId
      ? shopApi.updateVoucher(Number(voucherInput.id), payload)
      : shopApi.createVoucher(payload);
    reqCall
      .then(() => shopApi.getAdminVouchers())
      .then((fresh) => {
        if (Array.isArray(fresh)) writeJson(VOUCHERS_KEY, fresh.map(normalizeVoucherItem));
      })
      .catch(() => {});
  }
  return payload;
}

export function toggleVoucherActive(id) {
  const next = getAllVouchers().map((v) =>
    String(v.id) === String(id) ? { ...v, active: !v.active } : v
  );
  writeJson(VOUCHERS_KEY, next);

  if (tokenStorage.get() && !Number.isNaN(Number(id))) {
    shopApi
      .toggleVoucher(Number(id))
      .then(() => shopApi.getAdminVouchers())
      .then((fresh) => {
        if (Array.isArray(fresh)) writeJson(VOUCHERS_KEY, fresh.map(normalizeVoucherItem));
      })
      .catch(() => {});
  }
}

export function deleteVoucher(id) {
  const next = getAllVouchers().filter((v) => String(v.id) !== String(id));
  writeJson(VOUCHERS_KEY, next);

  if (tokenStorage.get() && !Number.isNaN(Number(id))) {
    shopApi.deleteVoucher(Number(id)).catch(() => {});
  }
}

export function computeVoucherDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.type === 'percent') {
    const raw = Math.round((subtotal * Number(coupon.value || 0)) / 100);
    return coupon.maxDiscount > 0 ? Math.min(raw, Number(coupon.maxDiscount)) : raw;
  }
  return Math.min(Number(coupon.value || 0), subtotal);
}

export function getSavedVoucherCodes() {
  const saved = readJson(SAVED_VOUCHERS_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

export function isVoucherSaved(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return false;
  return getSavedVoucherCodes().includes(normalized);
}

export function saveUserVoucher(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return false;
  const list = getSavedVoucherCodes();
  if (!list.includes(normalized)) {
    writeJson(SAVED_VOUCHERS_KEY, [normalized, ...list]);
  }
  return true;
}

// --- BANNERS ---
export function getAllBanners() {
  const saved = readJson(BANNERS_KEY, null);
  if (!Array.isArray(saved)) {
    return bannersLoaded ? DEFAULT_BANNERS : [];
  }
  return [...saved].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

export function getActiveBanners() {
  return getAllBanners().filter((b) => b.active !== false);
}

export async function saveBanner(bannerInput) {
  const list = getAllBanners();
  const rawId = bannerInput.id;
  const numId = Number(rawId);
  const isNumericId = rawId !== '' && rawId !== null && rawId !== undefined && Number.isFinite(numId) && numId > 0;

  const payload = {
    id: isNumericId ? numId : rawId || `b_${Date.now()}`,
    title: String(bannerInput.title || '').trim() || 'Banner khuyến mãi',
    imageUrl: String(bannerInput.imageUrl || '').trim() || '/banners/hero-main-1.svg',
    link: String(bannerInput.link || '').trim() || '/courses',
    type: bannerInput.type || 'HomeMain',
    position: Number(bannerInput.position) || 1,
    active: bannerInput.active !== false,
  };

  const existingIdx = list.findIndex((item) => String(item.id) === String(payload.id));
  const next =
    existingIdx >= 0
      ? list.map((item, idx) => (idx === existingIdx ? payload : item))
      : [...list, payload];

  writeJson(BANNERS_KEY, next);

  if (tokenStorage.get()) {
    try {
      const saved = isNumericId
        ? await shopApi.updateBanner(numId, payload)
        : await shopApi.createBanner(payload);
      const fresh = await shopApi.getAdminBanners().catch(() => null);
      if (Array.isArray(fresh) && fresh.length > 0) {
        writeJson(BANNERS_KEY, fresh.map(normalizeBannerItem));
      } else if (saved) {
        const normalized = normalizeBannerItem(saved);
        const updatedList = getAllBanners().map((item) =>
          String(item.id) === String(payload.id) ? normalized : item
        );
        writeJson(BANNERS_KEY, updatedList);
      }
    } catch {
      // Nếu lỗi mạng hoặc chưa kết nối backend, vẫn giữ bản cập nhật trong memoryCache / localStorage
    }
  }
  return payload;
}

export async function toggleBannerActive(id) {
  const next = getAllBanners().map((b) =>
    String(b.id) === String(id) ? { ...b, active: !b.active } : b
  );
  writeJson(BANNERS_KEY, next);

  const numId = Number(id);
  if (tokenStorage.get() && Number.isFinite(numId) && numId > 0) {
    try {
      await shopApi.toggleBanner(numId);
      const fresh = await shopApi.getAdminBanners().catch(() => null);
      if (Array.isArray(fresh) && fresh.length > 0) {
        writeJson(BANNERS_KEY, fresh.map(normalizeBannerItem));
      }
    } catch {
      // ignore
    }
  }
}

export async function deleteBanner(id) {
  const next = getAllBanners().filter((b) => String(b.id) !== String(id));
  writeJson(BANNERS_KEY, next);

  const numId = Number(id);
  if (tokenStorage.get() && Number.isFinite(numId) && numId > 0) {
    try {
      await shopApi.deleteBanner(numId);
    } catch {
      // ignore
    }
  }
}

// --- REACTIVE HOOK ---
export function useShopStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    syncShopFromBackend();
    const onUpdate = () => setTick((t) => t + 1);
    window.addEventListener(CHANGE_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const wishlist = getWishlist();
  const cart = getCart();
  const vouchers = getAllVouchers();
  const activeVouchers = getActiveVouchers();
  const savedVoucherCodes = getSavedVoucherCodes();
  const banners = getAllBanners();
  const activeBanners = getActiveBanners();
  const bannersLoading = !bannersLoaded && banners.length === 0;
  const vouchersLoading = !vouchersLoaded && vouchers.length === 0;

  return {
    wishlist,
    cart,
    vouchers,
    activeVouchers,
    vouchersLoading,
    savedVoucherCodes,
    isVoucherSaved,
    saveUserVoucher,
    banners,
    activeBanners,
    bannersLoading,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    isInCart,
    addToCart,
    removeFromCart,
    removeMultipleFromCart,
    clearCart,
    saveVoucher,
    toggleVoucherActive,
    deleteVoucher,
    saveBanner,
    toggleBannerActive,
    deleteBanner,
    syncShopFromBackend,
  };
}
