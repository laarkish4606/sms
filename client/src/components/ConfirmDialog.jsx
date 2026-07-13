import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', description, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}
