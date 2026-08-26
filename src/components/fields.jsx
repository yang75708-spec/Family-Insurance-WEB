'use client';

// 表单字段组件：对应小程序 picker / input / switch / checkbox-group

export function Picker({ label, options, value, onChange }) {
  const norm = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
  const values = norm.map((o) => o.value);
  return (
    <div className="row">
      <div className="label">{label}</div>
      <select
        className="input select"
        value={values.includes(value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled hidden>请选择</option>
        {norm.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function NumInput({ label, value, onChange, placeholder }) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      <input
        className="input"
        type="number"
        inputMode="decimal"
        value={value === undefined || value === null ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ''}
      />
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      <label className="switch">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="switch-ui">{checked ? '是' : '否'}</span>
      </label>
    </div>
  );
}

export function CbGroup({ types, values, onToggle }) {
  return (
    <div className="cb-group">
      {types.map((t) => (
        <label key={t} className="cb-item">
          <input type="checkbox" checked={!!values[t]} onChange={() => onToggle(t)} />
          <span>{t}</span>
        </label>
      ))}
    </div>
  );
}
