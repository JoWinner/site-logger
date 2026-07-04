"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

export function RecordDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    previousFocusRef.current?.focus();
  }, [open]);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="record-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={closeFromBackdrop}
      ref={dialogRef}
    >
      <div className="record-dialog__surface">
        <header className="record-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <button
            aria-label={`Close ${title}`}
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
        </header>
        <div className="record-dialog__content">{children}</div>
      </div>
    </dialog>
  );
}
