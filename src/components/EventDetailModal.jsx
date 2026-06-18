import { useState } from 'react'
import useEscapeKey from '../hooks/useEscapeKey'

export default function EventDetailModal({ event, onClose, onStatusUpdate, onDelete, onEdit, onSaveNotes, onReschedule }) {
  useEscapeKey(onClose)
  const {
    id, event_type, course_name, lesson_number, total_lessons,
    status, date, start_time, end_time,
    lessons_attended, lessons_upcoming, lessons_missed,
    color, title, notes: initialNotes,
  } = event

  const [lessonNotes, setLessonNotes] = useState(initialNotes || '')
  const [notesDirty, setNotesDirty] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDate, setEditDate] = useState(date)
  const [editStart, setEditStart] = useState(start_time)
  const [editEnd, setEditEnd] = useState(end_time)

  const isLesson = event_type === 'lesson'
  const isOngoing = isLesson && total_lessons == null

  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-SG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

  const fmtTime = (t) => {
    const [h, m] = t.split(':').map(Number)
    const d = new Date(); d.setHours(h, m)
    return d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditDate(date)
    setEditStart(start_time)
    setEditEnd(end_time)
  }

  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <div className="event-title-row">
            <span className="course-dot" style={{ background: color }} />
            <h2>{isLesson ? course_name : title}</h2>
          </div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isLesson && (
            <div className="lesson-chip" style={{ borderColor: color, color }}>
              {total_lessons ? `Lesson ${lesson_number} of ${total_lessons}` : `Lesson ${lesson_number}`}
            </div>
          )}

          {editing ? (
            <>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="detail-row">
                <span className="detail-label">Start</span>
                <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} />
              </div>
              <div className="detail-row">
                <span className="detail-label">End</span>
                <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span>{fmtDate(date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time</span>
                <span>{event.all_day ? 'All day' : `${fmtTime(start_time)} – ${fmtTime(end_time)}`}</span>
              </div>
            </>
          )}

          {isLesson && !isOngoing && (
            <div className="detail-row">
              <span className="detail-label">Progress</span>
              <span>{lessons_attended} attended · {lessons_upcoming} upcoming · {lessons_missed} missed</span>
            </div>
          )}

          {isLesson && !isOngoing && (
            <span className={`status-chip ${status}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}

          {isLesson ? (
            <div className="lesson-notes">
              <span className="detail-label">Notes</span>
              <textarea
                value={lessonNotes}
                onChange={e => { setLessonNotes(e.target.value); setNotesDirty(true) }}
                placeholder="Add notes for this lesson..."
                rows={3}
              />
              {notesDirty && (
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: 13 }}
                  onClick={() => { onSaveNotes(id, lessonNotes); setNotesDirty(false) }}
                >
                  Save notes
                </button>
              )}
            </div>
          ) : (
            initialNotes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <span>{initialNotes}</span>
              </div>
            )
          )}
        </div>

        <div className="modal-foot">
          {!isLesson && (
            <>
              <button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => onEdit(event)}>Edit</button>
              <button className="btn btn-danger" onClick={() => onDelete(id)}>Delete</button>
            </>
          )}

          {isLesson && editing && (
            <>
              <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ marginLeft: 'auto' }}
                onClick={() => onReschedule(id, editDate, editStart, editEnd)}
              >
                Save
              </button>
            </>
          )}

          {isLesson && !editing && (
            <>
              <button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => setEditing(true)}>
                Reschedule
              </button>
              {!isOngoing && status === 'missed' && (
                <button className="btn btn-ghost" onClick={() => onStatusUpdate(id, 'upcoming')}>Undo Missed</button>
              )}
              {!isOngoing && status !== 'missed' && (
                <button className="btn btn-danger" onClick={() => onStatusUpdate(id, 'missed')}>Mark Missed</button>
              )}
              {isOngoing && (
                <button className="btn btn-ghost" onClick={onClose}>Close</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
