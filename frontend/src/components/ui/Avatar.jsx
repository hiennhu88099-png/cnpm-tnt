// Ảnh đại diện; không có ảnh thì hiện chữ cái đầu của tên
export default function Avatar({ src, name = '', size = 36 }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (src) {
    return <img src={src} alt={name} className="avatar" style={style} />;
  }
  return (
    <span className="avatar" style={style} aria-label={name}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
