import useEscapeKey from '../hooks/useEscapeKey'

export default function SlotChoiceModal({ onAddCourse, onAddEvent, onClose }) {
  useEscapeKey(onClose)
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal choice-modal">
        <div className="modal-head">
          <h2>Add to Calendar</h2>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="choice-body">
          <button className="choice-btn" onClick={onAddCourse}>
            <span className="choice-title">Course</span>
            <span className="choice-desc">Recurring weekly series with lesson tracking</span>
          </button>
          <button className="choice-btn" onClick={onAddEvent}>
            <span className="choice-title">Event</span>
            <span className="choice-desc">One-off appointment or reminder</span>
          </button>
        </div>
      </div>
    </div>
  )
}
