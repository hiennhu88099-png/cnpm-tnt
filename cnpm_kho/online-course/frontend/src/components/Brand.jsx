import { Link } from 'react-router-dom';
import { SITE } from '../config/site';
import { Icon } from './ui';

export default function Brand({ onClick }) {
  return (
    <Link to="/" className="brand" onClick={onClick}>
      <span className="brand-mark">
        <Icon name="graduation" size={20} />
      </span>
      {SITE.name}
    </Link>
  );
}
