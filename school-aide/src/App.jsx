import { useState } from 'react'
import { transcribeAudio } from './services/transcribe.js'
import { structureTranscript } from './services/structure.js'
import InputScreen from './components/InputScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import GradingScreen from './components/GradingScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [assignments, setAssignments] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [error, setError] = useState(null)

  async function handleSubmit(audioBlob) {
    setError(null)
    setScreen('loading')
    try {
      const transcript = await transcribeAudio(audioBlob)
      const result = await structureTranscript(transcript)
      setAssignments(result.assignments ?? [])
      setScreen('results')
    } catch (e) {
      setError(e.message ?? 'Something went wrong. Please try again.')
      setScreen('input')
    }
  }

  function handleReset() {
    setAssignments([])
    setCompletedTasks([])
    setScreen('input')
  }

  function handleTurnIn(tasks) {
    setCompletedTasks(tasks)
    setScreen('grading')
  }

  if (screen === 'loading') {
    return (
      <div
        className="screen"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}
      >
        <div style={{ fontSize: 64 }}>🎧</div>
        <h2>Listening to your class...</h2>
        <p style={{ color: 'var(--color-text-soft)' }}>This takes about 30 seconds.</p>
      </div>
    )
  }

  if (screen === 'grading') {
    return <GradingScreen completedTasks={completedTasks} onBack={() => setScreen('results')} />
  }

  if (screen === 'results') {
    return <ResultsScreen assignments={assignments} onReset={handleReset} onTurnIn={handleTurnIn} />
  }

  return <InputScreen onSubmit={handleSubmit} error={error} />
}
