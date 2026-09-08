'use client';

// 表单字段组件：暖调胶囊 / 数字输入 / 分段开关 / 多选 chips

function unitOf(placeholder) {
  if (!placeholder) return null;
  if (placeholder.indexOf('万') > -1) return '万';
  if (placeholder.indexOf('岁') > -1) return '岁';
  if (placeholder.indexOf('个') > -1) return '个';
  if (placeholder.indexOf('位') > -1) return '位';
  return null;
}

export function Picker({ label, options, value, onChange, hint }) {
  const opts = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  return (
    <div className="field">
      <div className="field-label">{label}{hint ? <span className="hint">{hint}</span> : null}</div>
      <div className="pill-row" role="radiogroup" aria-label={label}>
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={'pill' + (o.value === value ? ' is-on' : '')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NumInput({ label, value, onChange, placeholder }) {
  const unit = unitOf(placeholder);
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="num-box">
        <input
          type="number"
          inputMode="decimal"
          value={value === undefined || value === null ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '请输入'}
        />
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="seg" role="radiogroup" aria-label={label}>
        <button type="button" role="radio" aria-checked={!!checked}
          className={checked ? 'is-on' : ''} onClick={() => onChange(true)}>是</button>
        <button type="button" role="radio" aria-checked={!checked}
          className={!checked ? 'is-on' : ''} onClick={() => onChange(false)}>否</button>
      </div>
    </div>
  );
}

export function CbGroup({ types, values, onToggle }) {
  return (
    <div className="chip-group" role="group">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          role="checkbox"
          aria-checked={!!values[t]}
          className={'chip' + (values[t] ? ' is-on' : '')}
          onClick={() => onToggle(t)}
        >
          {values[t] ? '✓ ' : ''}{t}
        </button>
      ))}
    </div>
  );
}
