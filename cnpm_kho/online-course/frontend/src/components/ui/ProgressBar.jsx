// Thanh tiến độ 0–100 (vd. tiến độ học của một khóa)
export default function ProgressBar({ value = 0, label }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="progress-wrap">
      <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
      {label !== false && <span className="progress-label">{label ?? `${percent}%`}</span>}
    </div>
  );
}
