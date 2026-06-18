import useEscapeKey from '../hooks/useEscapeKey'

export default function LessonScopeModal({ action, onOne, onFuture, onCancel }) {
  useEscapeKey(onCancel)
  const verb = action === 'resize' ? 'Resize' : 'Move'
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal choice-modal">
        <div className="modal-head">
          <h2>{verb} Lesson</h2>
          <button className="modal-x" onClick={onCancel}>×</button>
        </div>
        <div className="choice-body">
          <button className="choice-btn" onClick={onOne}>
            <span className="choice-title">Just this lesson</span>
            <span className="choice-desc">Only this occurrence is changed</span>
          </button>
          <button className="choice-btn" onClick={onFuture}>
            <span className="choice-title">This and all future lessons</span>
            <span className="choice-desc">Changes apply from this lesson onwards</span>
          </button>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
