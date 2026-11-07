import { useState } from 'react';

const DEFAULT_AVATAR = '/default-avatar.png';

const SIZE_PRESETS = {
  xs: 24,
  sm: 34,
  md: 40,
  lg: 56,
  xl: 72,
};

// Ảnh đại diện; không có ảnh riêng hoặc ảnh lỗi thì dùng ảnh mặc định /default-avatar.png
export default function Avatar({ src, name = '', size = 36 }) {
  const [failedSrc, setFailedSrc] = useState('');
  const pixelSize = typeof size === 'number' ? size : SIZE_PRESETS[size] || Number(size) || 36;
  const style = { width: pixelSize, height: pixelSize };
  const resolvedSrc = src && src !== failedSrc ? src : DEFAULT_AVATAR;

  return (
    <img
      src={resolvedSrc}
      alt={name}
      className="avatar"
      style={style}
      onError={() => {
        if (src && failedSrc !== src) {
          setFailedSrc(src);
        }
      }}
    />
  );
}
