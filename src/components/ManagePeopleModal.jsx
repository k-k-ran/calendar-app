import { useState } from 'react'
import useEscapeKey from '../hooks/useEscapeKey'

export default function ManagePeopleModal({
  people, selectedPeople, colors,
  onToggle, onAdd, onUpdate, onDelete, onClose,
}) {
  useEscapeKey(onClose)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', color: colors[1] })

  const startEdit = (person) => {
    setEditingId(person.id)
    setEditName(person.name)
    setEditColor(person.color)
  }

  const commitEdit = (personId) => {
    if (editName.trim()) onUpdate(personId, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  const handleAdd = () => {
    if (!newPerson.name.trim()) return
    onAdd(newPerson)
    setNewPerson({ name: '', color: colors[1] })
    setAddingPerson(false)
  }

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <h2>Manage People</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="manage-hint">Toggle visibility. Click a name to rename or change colour.</p>

          {people.map(person => (
            <div key={person.id} className="manage-person-row-wrap">
              <div className="manage-person-row">
                <button
                  className={`person-toggle ${selectedPeople.has(person.id) ? 'active' : ''}`}
                  style={{ '--person-color': editingId === person.id ? editColor : person.color }}
                  onClick={() => onToggle(person.id)}
                />
                {editingId === person.id ? (
                  <input
                    className="person-input-light"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(person.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    className="manage-person-name editable"
                    onClick={() => startEdit(person)}
                    title="Click to rename or change colour"
                  >
                    {person.name}
                  </span>
                )}
                {people.length > 1 && (
                  <button className="delete-btn delete-btn-visible" onClick={() => onDelete(person.id)}>×</button>
                )}
              </div>

              {editingId === person.id && (
                <div className="edit-person-extra">
                  <div className="color-row">
                    {colors.map(c => (
                      <button
                        key={c}
                        className={`swatch${editColor === c ? ' active' : ''}`}
                        style={{ background: c }}
                        onClick={() => setEditColor(c)}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => commitEdit(person.id)}>Save</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addingPerson ? (
            <div className="add-person-form" style={{ marginTop: 12 }}>
              <input
                className="person-input-light"
                value={newPerson.name}
                onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <div className="color-row">
                {colors.map(c => (
                  <button
                    key={c}
                    className={`swatch${newPerson.color === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewPerson(p => ({ ...p, color: c }))}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setAddingPerson(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd}>Add</button>
              </div>
            </div>
          ) : (
            <button className="add-person-btn-light" onClick={() => setAddingPerson(true)}>
              + Add person
            </button>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
