import { useState } from 'react'

export default function TaskItem({ text, description }) {
  const [done, setDone] = useState(false)

  return (
    <li
      onClick={() => setDone((d) => !d)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 8px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        background: done ? 'var(--color-done)' : 'transparent',
        borderRadius: 8,
        transition: 'background 0.2s',
        listStyle: 'none',
        userSelect: 'none',
        minHeight: 44,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: done ? 'none' : '3px solid var(--color-border)',
          background: done ? 'var(--color-success)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 800,
          transition: 'all 0.2s',
          marginTop: 2,
        }}
      >
        {done ? '✓' : ''}
      </span>
      <span style={{ flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: '1.05rem',
            fontWeight: 600,
            textDecoration: done ? 'line-through' : 'none',
            color: done ? 'var(--color-text-soft)' : 'var(--color-text)',
            transition: 'color 0.2s',
          }}
        >
          {text}
        </span>
        {description && (
          <span
            style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 400,
              color: done ? 'var(--color-text-soft)' : '#666',
              marginTop: 4,
              lineHeight: 1.4,
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {description}
          </span>
        )}
      </span>
    </li>
  )
}
