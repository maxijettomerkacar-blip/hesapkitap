'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-content-wrapper">
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close-button" onClick={onCancel} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
