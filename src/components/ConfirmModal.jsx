import useEscapeKey from '../hooks/useEscapeKey'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  useEscapeKey(onCancel)
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal confirm-modal">
        <div className="modal-head">
          <h2>Confirm Delete</h2>
          <button className="modal-x" onClick={onCancel}>×</button>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
