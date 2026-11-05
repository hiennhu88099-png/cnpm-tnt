import { useState } from 'react';

const DEFAULT_AVATAR = '/default-avatar.png';

// Ảnh đại diện; không có ảnh riêng hoặc ảnh lỗi thì dùng ảnh mặc định /default-avatar.png
export default function Avatar({ src, name = '', size = 36 }) {
  const [failedSrc, setFailedSrc] = useState('');
  const style = { width: size, height: size };
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
