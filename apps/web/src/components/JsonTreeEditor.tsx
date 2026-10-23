'use client';

import { useState } from 'react';

type JsonTreeEditorProps = {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
  canRemove?: boolean;
  onRemove?: () => void;
};

function prettyLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (first) => first.toUpperCase());
}

function emptyObjectFor(arrayName: string): Record<string, unknown> {
  const examples: Record<string, Record<string, unknown>> = {
    stats: { value: '', suffix: '', label: '' },
    metrics: { title: '', value: '' },
    experience: { period: '', role: '', company: '', bullets: [''], tags: [''] },
    projects: { name: '', emoji: '', description: '', liveUrl: '', tags: [''] },
    journey: { date: '', title: '' },
    items: { name: '', meta: '', icon: '', tags: [''] },
    writing: { title: '', description: '', href: '', icon: '' },
    methods: { label: '', value: '', href: '' },
    socialLinks: { label: '', href: '' },
  };
  return examples[arrayName] || { title: '', description: '' };
}

function emptyValueFor(arrayName: string, items: unknown[]) {
  if (items.length > 0) {
    const template = items[0];
    if (typeof template === 'string') return '';
    if (typeof template === 'number') return 0;
    if (typeof template === 'boolean') return false;
    if (Array.isArray(template)) return [];
    if (template && typeof template === 'object') {
      return Object.fromEntries(
        Object.entries(template).map(([key, value]) => [
          key,
          value && typeof value === 'object'
            ? Array.isArray(value)
              ? []
              : {}
            : typeof value === 'string'
              ? ''
              : typeof value === 'number'
                ? 0
                : typeof value === 'boolean'
                  ? false
                  : null,
        ]),
      );
    }
  }

  if (['roles', 'openTo', 'tags', 'keywords', 'highlights', 'bullets'].includes(arrayName)) return '';
  return emptyObjectFor(arrayName);
}

export function JsonTreeEditor({
  label,
  value,
  onChange,
  depth = 0,
  canRemove = false,
  onRemove,
}: JsonTreeEditorProps) {
  const [newKey, setNewKey] = useState('');

  if (value === null || value === undefined || typeof value === 'string') {
    const text = typeof value === 'string' ? value : '';
    const control =
      text.length > 140 || text.includes('\n') ? (
        <textarea rows={Math.min(8, Math.max(3, text.split('\n').length))} value={text} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={text} onChange={(event) => onChange(event.target.value)} />
      );
    return (
      <div className="tree-scalar">
        <label>
          <span>{prettyLabel(label)}</span>
          {control}
        </label>
        {canRemove && <button type="button" className="tree-remove" onClick={onRemove}>Remove</button>}
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="tree-scalar">
        <label>
          <span>{prettyLabel(label)}</span>
          <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        </label>
        {canRemove && <button type="button" className="tree-remove" onClick={onRemove}>Remove</button>}
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="tree-scalar tree-boolean">
        <label className="checkbox-label">
          <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
          <span>{prettyLabel(label)}</span>
        </label>
        {canRemove && <button type="button" className="tree-remove" onClick={onRemove}>Remove</button>}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <details className={`tree-group tree-array depth-${Math.min(depth, 4)}`} open={depth === 0}>
        <summary>{prettyLabel(label)} <span className="tree-count">{value.length} items</span></summary>
        <div className="tree-children">
          {value.map((item, index) => (
            <JsonTreeEditor
              key={`${label}-${index}`}
              label={`${prettyLabel(label)} item ${index + 1}`}
              value={item}
              depth={depth + 1}
              canRemove
              onRemove={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              onChange={(nextItem) => onChange(value.map((current, itemIndex) => itemIndex === index ? nextItem : current))}
            />
          ))}
          <button
            type="button"
            className="tree-add"
            onClick={() => onChange([...value, emptyValueFor(label, value)])}
          >
            + Add {value.length && typeof value[0] === 'string' ? 'item' : 'entry'}
          </button>
        </div>
      </details>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <details className={`tree-group tree-object depth-${Math.min(depth, 4)}`} open={depth === 0}>
        <summary>{prettyLabel(label)}</summary>
        <div className="tree-children">
          {entries.map(([key, child]) => (
            <JsonTreeEditor
              key={key}
              label={key}
              value={child}
              depth={depth + 1}
              canRemove
              onRemove={() => {
                const next = { ...(value as Record<string, unknown>) };
                delete next[key];
                onChange(next);
              }}
              onChange={(nextValue) => onChange({ ...(value as Record<string, unknown>), [key]: nextValue })}
            />
          ))}
          <div className="tree-add-property">
            <input
              aria-label={`Add a field to ${label}`}
              placeholder="New field name"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
            />
            <button
              type="button"
              className="tree-add"
              disabled={!newKey.trim() || Object.hasOwn(value, newKey.trim())}
              onClick={() => {
                const key = newKey.trim();
                if (!key || Object.hasOwn(value, key)) return;
                onChange({ ...(value as Record<string, unknown>), [key]: '' });
                setNewKey('');
              }}
            >
              + Add field
            </button>
          </div>
        </div>
      </details>
    );
  }

  return null;
}
