import Skeleton, { AdminTableSkeleton } from './Skeleton';

// size: sm | md | lg
export default function Spinner({ size = 'md' }) {
  return <span className={`spinner${size !== 'md' ? ` spinner-${size}` : ''}`} role="status" aria-label="Đang tải" />;
}

export function PageLoading({ text = 'Đang tải...' }) {
  return (
    <div className="stack" aria-busy="true" aria-label={text}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '48%' }}>
          <Skeleton width={96} height={12} radius={4} />
          <Skeleton width="72%" height={28} radius={8} />
          <Skeleton width="90%" height={14} radius={4} />
        </div>
        <Skeleton width={140} height={38} radius={8} />
      </div>
      <AdminTableSkeleton rows={5} cols={5} />
    </div>
  );
}
