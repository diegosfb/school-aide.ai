import TaskItem from './TaskItem.jsx'

const CARD_COLORS = [
  { bg: '#fff3e0', accent: '#ff9800' },
  { bg: '#e3f2fd', accent: '#2196f3' },
  { bg: '#f3e5f5', accent: '#9c27b0' },
  { bg: '#e8f5e9', accent: '#4caf50' },
  { bg: '#fce4ec', accent: '#e91e63' },
]

export default function AssignmentCard({ title, tasks, colorIndex }) {
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length]

  return (
    <div
      style={{
        background: color.bg,
        borderRadius: 'var(--radius)',
        padding: 24,
        boxShadow: 'var(--shadow)',
        marginBottom: 20,
        borderLeft: `6px solid ${color.accent}`,
      }}
    >
      <h2 style={{ color: color.accent, marginBottom: 16 }}>{title}</h2>
      <ul style={{ padding: 0 }}>
        {(tasks ?? []).map((task, i) => (
          <TaskItem key={i} text={task.text ?? task} description={task.description} />
        ))}
      </ul>
    </div>
  )
}
