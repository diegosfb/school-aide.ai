import { useState } from 'react'
import AssignmentCard from './AssignmentCard.jsx'

export default function ResultsScreen({ assignments, onReset, onTurnIn }) {
  // doneMap[assignmentIdx][taskIdx] = true/false
  const [doneMap, setDoneMap] = useState({})

  function handleTaskToggle(aIdx, tIdx, isDone) {
    setDoneMap((prev) => ({
      ...prev,
      [aIdx]: { ...(prev[aIdx] ?? {}), [tIdx]: isDone },
    }))
  }

  function handleTurnIn() {
    const completed = []
    assignments.forEach((a, aIdx) => {
      ;(a.tasks ?? []).forEach((task, tIdx) => {
        if (doneMap[aIdx]?.[tIdx]) {
          completed.push({ assignmentTitle: a.title, text: task.text ?? task, description: task.description })
        }
      })
    })
    onTurnIn(completed)
  }

  const completedCount = Object.values(doneMap).flatMap(Object.values).filter(Boolean).length

  if (assignments.length === 0) {
    return (
      <div className="screen" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🤔</div>
        <h2>No tasks found</h2>
        <p style={{ color: 'var(--color-text-soft)', margin: '12px 0 32px' }}>
          The recording did not have any clear assignments. Try again with a different recording.
        </p>
        <button className="btn-primary" onClick={onReset}>← Try again</button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
        <div>
          <div style={{ fontSize: 40 }}>📋</div>
          <h1 style={{ fontSize: '1.6rem', marginTop: 4 }}>Your tasks for today</h1>
          <p style={{ color: 'var(--color-text-soft)', fontSize: '0.95rem', marginTop: 4 }}>
            Tap each task when you finish it!
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={onReset}
          style={{ flexShrink: 0, fontSize: '0.9rem', padding: '10px 18px' }}
        >
          ← New list
        </button>
      </div>

      {assignments.map((a, i) => (
        <AssignmentCard
          key={i}
          title={a.title}
          tasks={a.tasks}
          colorIndex={i}
          onTaskToggle={(tIdx, isDone) => handleTaskToggle(i, tIdx, isDone)}
        />
      ))}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleTurnIn}
          disabled={completedCount === 0}
          style={{ fontSize: '1.1rem', padding: '16px 40px', opacity: completedCount === 0 ? 0.4 : 1 }}
        >
          📬 Turn in work ({completedCount} done)
        </button>
      </div>
    </div>
  )
}
