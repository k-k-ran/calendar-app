import { useState } from 'react'
import useEscapeKey from '../hooks/useEscapeKey'

export default function AddCourseModal({ colors, people = [], defaultPersonId, onClose, onSubmit, initialDate, initialTime, initialEndTime }) {
  useEscapeKey(onClose)
  const today = new Date().toISOString().split('T')[0]
  const [ongoing, setOngoing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    total_lessons: 5,
    start_date: initialDate || (today < '2026-01-01' ? '2026-01-01' : today),
    start_time: initialTime || '10:00',
    end_time: initialEndTime || '11:00',
    color: colors[0],
    person_id: defaultPersonId || '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.start_date) return
    onSubmit({
      ...form,
      total_lessons: ongoing ? null : parseInt(form.total_lessons),
    })
  }

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>Add Course Series</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label>
              Course Name
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Swimming"
                required
                autoFocus
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ongoing}
                onChange={e => setOngoing(e.target.checked)}
              />
              Ongoing (no fixed end)
            </label>

            {!ongoing && (
              <label>
                Number of Lessons
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.total_lessons}
                  onChange={e => set('total_lessons', e.target.value)}
                  required
                />
              </label>
            )}

            <label>
              First Lesson Date
              <input
                type="date"
                value={form.start_date}
                min="2026-01-01"
                onChange={e => set('start_date', e.target.value)}
                required
              />
            </label>

            <div className="two-col">
              <label>
                Start Time
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  required
                />
              </label>
              <label>
                End Time
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  required
                />
              </label>
            </div>

            {people.length > 1 && (
              <label>
                Person
                <select value={form.person_id} onChange={e => set('person_id', e.target.value)}>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Colour
              <div className="color-row">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`swatch${form.color === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => set('color', c)}
                  />
                ))}
              </div>
            </label>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Course</button>
          </div>
        </form>
      </div>
    </div>
  )
}
