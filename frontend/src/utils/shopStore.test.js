import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatNumber, formatPrice } from './format.js';
import {
  addToCart,
  clearCart,
  computeVoucherDiscount,
  deleteBanner,
  getActiveBanners,
  getAllBanners,
  getCart,
  isInCart,
  isInWishlist,
  isVoucherSaved,
  removeFromCart,
  saveBanner,
  saveUserVoucher,
  toggleBannerActive,
  toggleWishlist,
} from './shopStore.js';

describe('Format Utilities (format.js)', () => {
  it('formats zero price as Miễn phí and positive price in VND', () => {
    assert.equal(formatPrice(0), 'Miễn phí');
    assert.match(formatPrice(299000), /299\.000/);
  });

  it('formats numbers and dates in vi-VN locale', () => {
    assert.equal(formatNumber(12500), '12.500');
    assert.equal(formatDate(''), '');
  });
});

describe('Voucher Discount & Saved Wallet Logic (shopStore.js)', () => {
  it('computes percentage voucher discount and respects maxDiscount cap', () => {
    const percentCoupon = {
      code: 'NEWSTUDENT',
      type: 'percent',
      value: 20,
      maxDiscount: 100000,
    };
    assert.equal(computeVoucherDiscount(percentCoupon, 300000), 60000);
    assert.equal(computeVoucherDiscount(percentCoupon, 800000), 100000);
  });

  it('computes fixed voucher discount without exceeding order subtotal', () => {
    const fixedCoupon = {
      code: 'EDUHUB50',
      type: 'fixed',
      value: 50000,
    };
    assert.equal(computeVoucherDiscount(fixedCoupon, 200000), 50000);
    assert.equal(computeVoucherDiscount(fixedCoupon, 30000), 30000);
  });

  it('persists saved voucher codes case-insensitively', () => {
    assert.equal(isVoucherSaved('eduhub50'), false);
    saveUserVoucher('eduhub50');
    assert.equal(isVoucherSaved('EDUHUB50'), true);
    assert.equal(isVoucherSaved('  eduhub50  '), true);
  });
});

describe('Cart, Wishlist & Banner Store Logic (shopStore.js)', () => {
  it('adds, checks, removes and clears courses in shopping cart', () => {
    clearCart();
    const course = { id: 101, title: 'Spring Boot Pro', price: 399000 };
    assert.equal(isInCart(101), false);

    addToCart(course);
    assert.equal(isInCart(101), true);
    assert.equal(getCart().length, 1);

    removeFromCart(101);
    assert.equal(isInCart(101), false);
  });

  it('toggles course in wishlist on and off', () => {
    const course = { id: 202, title: 'React 19 Masterclass', price: 299000 };
    const added = toggleWishlist(course);
    assert.equal(added, true);
    assert.equal(isInWishlist(202), true);

    const removed = toggleWishlist(course);
    assert.equal(removed, false);
    assert.equal(isInWishlist(202), false);
  });

  it('creates, updates, toggles and deletes banners in memory cache', async () => {
    const created = await saveBanner({
      title: 'Banner Test 1',
      imageUrl: '/banners/hero-main-1.svg',
      link: '/courses',
      type: 'HomeMain',
      position: 1,
      active: true,
    });

    assert.equal(getAllBanners().some((b) => b.id === created.id), true);

    await saveBanner({
      ...created,
      title: 'Banner Test 1 Updated',
    });
    const updated = getAllBanners().find((b) => b.id === created.id);
    assert.equal(updated.title, 'Banner Test 1 Updated');

    await toggleBannerActive(created.id);
    assert.equal(getActiveBanners().some((b) => b.id === created.id), false);

    await deleteBanner(created.id);
    assert.equal(getAllBanners().some((b) => b.id === created.id), false);
  });
});

