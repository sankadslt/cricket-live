import { useEffect } from 'react';
// Pop-up. Closes with Esc or a tap on the dark area.
export default function Modal({ title, children, onClose, wide }) {
  useEffect(() => { const f = e => e.key === 'Escape' && onClose?.(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [onClose]);
  return <div className="modal" onClick={onClose}><div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
    <div className="sheet-h"><h3>{title}</h3><button className="x" aria-label="Close" onClick={onClose}>✕</button></div>{children}</div></div>;
}
