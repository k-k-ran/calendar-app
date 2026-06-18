import { useState } from 'react'
import useEscapeKey from '../hooks/useEscapeKey'

export default function EditCourseModal({ course, colors, people = [], onClose, onSubmit }) {
  useEscapeKey(onClose)
  const [form, setForm] = useState({
    name: course.name || '',
    color: course.color || colors[0],
    person_id: course.person_id || '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>Edit Course</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label>
              Course Name
              <input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
            </label>

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
                  <button key={c} type="button" className={`swatch${form.color === c ? ' active' : ''}`} style={{ background: c }} onClick={() => set('color', c)} />
                ))}
              </div>
            </label>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
