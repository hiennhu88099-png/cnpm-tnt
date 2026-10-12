// Khung trắng bo góc. Có title thì tự thêm phần header.
export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="card-header">
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
