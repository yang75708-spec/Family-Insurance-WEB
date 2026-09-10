'use client';

// 表单字段组件：原生下拉 / 数字输入 / 是否下拉 / 原生多选

function unitOf(placeholder) {
  if (!placeholder) return null;
  if (placeholder.indexOf('万') > -1) return '万';
  if (placeholder.indexOf('岁') > -1) return '岁';
  if (placeholder.indexOf('个') > -1) return '个';
  if (placeholder.indexOf('位') > -1) return '位';
  return null;
}

export function Picker({ label, options, value, onChange }) {
  const opts = (options || []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="dd">
        <select
          className="dd-select"
          aria-label={label}
          value={value === undefined || value === null ? '' : value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>请选择</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
      <div className="dd">
        <select
          className="dd-select"
          aria-label={label}
          value={checked ? '是' : '否'}
          onChange={(e) => onChange(e.target.value === '是')}
        >
          <option value="是">是</option>
          <option value="否">否</option>
        </select>
      </div>
    </div>
  );
}

export function CbGroup({ types, values, onToggle }) {
  return (
    <div className="check-group" role="group">
      {types.map((t) => (
        <label key={t} className="check-item">
          <input type="checkbox" checked={!!values[t]} onChange={() => onToggle(t)} />
          <span className="check-box" aria-hidden="true" />
          <span>{t}</span>
        </label>
      ))}
    </div>
  );
}
