import { useState } from 'react'

export default function GradingScreen({ completedTasks, onBack }) {
  const [grades, setGrades] = useState({})

  function setGrade(idx, value) {
    setGrades((prev) => ({ ...prev, [idx]: value }))
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          className="btn-secondary"
          onClick={onBack}
          style={{ fontSize: '0.9rem', padding: '10px 18px', flexShrink: 0 }}
        >
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 36 }}>📝</div>
          <h1 style={{ fontSize: '1.5rem', marginTop: 4 }}>Grade the work</h1>
          <p style={{ color: 'var(--color-text-soft)', fontSize: '0.9rem', marginTop: 2 }}>
            Mark each task right or wrong.
          </p>
        </div>
      </div>

      {completedTasks.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-soft)', marginTop: 40 }}>
          No completed tasks to grade.
        </p>
      ) : (
        completedTasks.map((task, i) => {
          const grade = grades[i]
          return (
            <div
              key={i}
              style={{
                background: grade === 'right' ? '#e8f5e9' : grade === 'wrong' ? '#fce4ec' : 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                marginBottom: 16,
                boxShadow: 'var(--shadow)',
                borderLeft: `6px solid ${grade === 'right' ? '#4caf50' : grade === 'wrong' ? '#e91e63' : 'var(--color-border)'}`,
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {task.assignmentTitle}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>{task.text}</p>
              {task.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-soft)', marginBottom: 16 }}>{task.description}</p>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setGrade(i, 'right')}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 'var(--radius-sm)',
                    border: '2px solid',
                    borderColor: grade === 'right' ? '#4caf50' : '#ccc',
                    background: grade === 'right' ? '#4caf50' : '#fff',
                    color: grade === 'right' ? '#fff' : '#333',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  ✓ Right
                </button>
                <button
                  onClick={() => setGrade(i, 'wrong')}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 'var(--radius-sm)',
                    border: '2px solid',
                    borderColor: grade === 'wrong' ? '#e91e63' : '#ccc',
                    background: grade === 'wrong' ? '#e91e63' : '#fff',
                    color: grade === 'wrong' ? '#fff' : '#333',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  ✗ Wrong
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
