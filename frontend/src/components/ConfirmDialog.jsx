import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ConfirmDialog({ open, title, children, confirmLabel, busy, onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  useEffect(() => { if (open) confirmRef.current?.focus(); }, [open]);
  if (!open) return null;
  return <div className="dialog-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description"><span className="dialog-icon"><AlertTriangle size={26} /></span><h2 id="dialog-title">{title}</h2><p id="dialog-description">{children}</p><div className="dialog-actions"><button className="text-button" onClick={onCancel} disabled={busy}>Annulla</button><button ref={confirmRef} className="filled-button danger" onClick={onConfirm} disabled={busy}>{busy ? 'Attendi…' : confirmLabel}</button></div></section></div>;
}
