import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

function extractOptionsFromChildren(children) {
  const result = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      const val = child.props.value !== undefined ? String(child.props.value) : '';
      const label =
        typeof child.props.children === 'string' || typeof child.props.children === 'number'
          ? String(child.props.children)
          : Children.toArray(child.props.children).join('');
      result.push({
        value: val,
        rawValue: child.props.value !== undefined ? child.props.value : '',
        label,
        disabled: Boolean(child.props.disabled),
      });
    } else if (child.props?.children) {
      result.push(...extractOptionsFromChildren(child.props.children));
    }
  });
  return result;
}

export default function CustomSelect({
  id,
  name,
  value,
  onChange,
  options,
  children,
  variant = 'input',
  leftIcon,
  disabled = false,
  className = '',
  style,
  placeholder = 'Chọn...',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => ({
        value: String(opt.value ?? ''),
        rawValue: opt.value ?? '',
        label: String(opt.label ?? ''),
        disabled: Boolean(opt.disabled),
      }));
    }
    return extractOptionsFromChildren(children);
  }, [options, children]);

  const strValue = value !== undefined && value !== null ? String(value) : '';
  const selectedOption =
    normalizedOptions.find((opt) => opt.value === strValue) || normalizedOptions[0] || null;

  useEffect(() => {
    if (!open) return undefined;
    function handleOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function handleWindowScroll() {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      if (rect.bottom < 96 || rect.top > window.innerHeight) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector('.custom-select-option.is-selected');
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open]);

  function handleSelectOption(opt) {
    if (opt.disabled) return;
    setOpen(false);
    if (typeof onChange === 'function') {
      onChange({
        target: {
          id: selectId,
          name: name || selectId,
          value: opt.rawValue,
        },
      });
    }
  }

  const isPill = variant === 'pill';

  return (
    <div
      ref={wrapRef}
      className={`custom-select-wrap${isPill ? ' is-pill' : ''}${open ? ' is-open' : ''}${
        disabled ? ' is-disabled' : ''
      } ${className}`.trim()}
      style={style}
    >
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={
          isPill
            ? `catalog-pill-select custom-select-trigger${leftIcon ? ' has-left-icon' : ''}`
            : `input custom-select-trigger${leftIcon ? ' has-leading-icon' : ''}`
        }
      >
        {leftIcon && (
          <span className={isPill ? 'catalog-pill-icon' : 'custom-select-left-icon'} aria-hidden="true">
            <Icon name={leftIcon} size={16} />
          </span>
        )}
        <span className="custom-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`custom-select-chevron${open ? ' is-rotated' : ''}`} aria-hidden="true">
          <Icon name="chevronDown" size={16} />
        </span>
      </button>

      {open && normalizedOptions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={selectId}
          className={`custom-select-menu${isPill ? ' is-pill-menu' : ''}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === strValue;
            return (
              <li
                key={opt.value === '' ? '__EMPTY__' : opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectOption(opt)}
                className={`custom-select-option${isSelected ? ' is-selected' : ''}${
                  opt.disabled ? ' is-disabled' : ''
                }`}
              >
                <span className="custom-select-option-label">{opt.label}</span>
                {isSelected && (
                  <span className="custom-select-option-check" aria-hidden="true">
                    <Icon name="check" size={15} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

