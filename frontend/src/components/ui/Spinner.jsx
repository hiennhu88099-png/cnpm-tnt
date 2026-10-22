// size: sm | md | lg
export default function Spinner({ size = 'md' }) {
  return <span className={`spinner${size !== 'md' ? ` spinner-${size}` : ''}`} role="status" aria-label="Đang tải" />;
}

export function PageLoading({ text = 'Đang tải...' }) {
  return (
    <div className="page-loading">
      <Spinner size="lg" />
      <span>{text}</span>
    </div>
  );
}
