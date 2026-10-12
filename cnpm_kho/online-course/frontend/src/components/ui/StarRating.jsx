import Icon from './Icon';
import { formatNumber } from '../../utils/format';

// Hiển thị điểm đánh giá: 4.8 ★★★★★ (312)
export default function StarRating({ value = 0, count }) {
  const rounded = Math.round(value);
  return (
    <span className="rating" aria-label={`${value} trên 5 sao`}>
      <span className="rating-value">{Number(value).toFixed(1)}</span>
      <span className="rating-stars">
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name="star" size={14} fill="currentColor" strokeWidth={0} className={i > rounded ? 'is-empty' : undefined} />
        ))}
      </span>
      {count != null && <span className="rating-count">({formatNumber(count)})</span>}
    </span>
  );
}
