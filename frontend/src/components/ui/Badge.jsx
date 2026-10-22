// variant: primary | success | warning | danger | neutral
export default function Badge({ variant = 'neutral', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
