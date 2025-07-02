import { createPortal } from 'react-dom';
import { ConfirmationDialogProps } from '../../types/ui';

const ConfirmationDialog = ({ open, onClose, onConfirm, title, children }: ConfirmationDialogProps) => {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-foreground rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
                <div className="text-text-secondary mb-6">{children}</div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-text-secondary hover:bg-background rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationDialog;