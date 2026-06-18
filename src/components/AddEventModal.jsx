import { useState } from 'react'
import useEscapeKey from '../hooks/useEscapeKey'

function addHour(time) {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function AddEventModal({ colors, people = [], defaultPersonId, onClose, onSubmit, initialDate, initialTime, initialEndTime, initialAllDay }) {
  useEscapeKey(onClose)
  const today = new Date().toISOString().split('T')[0]
  const [allDay, setAllDay] = useState(initialAllDay || false)
  const [form, setForm] = useState({
    title: '',
    date: initialDate || today,
    start_time: initialTime || '10:00',
    end_time: initialEndTime || (initialTime ? addHour(initialTime) : '11:00'),
    color: colors[2],
    notes: '',
    person_id: defaultPersonId || '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSubmit({ ...form, all_day: allDay })
  }

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>Add Event</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label>
              Title
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Doctor appointment"
                required
                autoFocus
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allDay}
                onChange={e => setAllDay(e.target.checked)}
              />
              All-day event
            </label>

            {!allDay && (
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
            )}

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
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any notes..."
                rows={2}
              />
            </label>

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
            <button type="submit" className="btn btn-primary">Add Event</button>
          </div>
        </form>
      </div>
    </div>
  )
}
