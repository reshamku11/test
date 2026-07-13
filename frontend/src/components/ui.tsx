import { Check, ChevronLeft, ChevronRight, Ellipsis, Info, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PAGE_SIZE_OPTIONS, TOAST_DURATION_MS } from '../config';
import { pageRange } from '../utils/finance';

export function Modal({ title, children, onClose, wide = false, className = '' }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose(); document.addEventListener('keydown', close); ref.current?.focus(); return () => document.removeEventListener('keydown', close); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className={`modal ${wide ? 'wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}><header><h2 id="modal-title">{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></header>{children}</div></div>;
}

export function ConfirmModal({ title, body, confirmLabel = 'Confirm', danger = false, success = false, compact = false, onConfirm, onClose, loading = false }: { title: string; body: string; confirmLabel?: string; danger?: boolean; success?: boolean; compact?: boolean; onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  return <Modal title={title} onClose={onClose} className={compact ? 'booking-confirm-modal' : ''}><div className={`confirm-body ${compact ? 'compact' : ''}`}>{!compact && <span className={`confirm-icon ${danger ? 'danger' : ''}`}><Info /></span>}<p>{body}</p></div><div className="modal-actions"><button className="btn secondary" onClick={onClose}>Cancel</button><button className={`btn ${danger ? 'danger' : success ? 'success' : 'primary'}`} onClick={onConfirm} disabled={loading}>{loading ? 'Working…' : confirmLabel}</button></div></Modal>;
}

export interface MenuItem { label: string; icon?: ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void; divider?: boolean }

export function ActionMenu({ items, label = 'More actions' }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; const key = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false); document.addEventListener('mousedown', close); document.addEventListener('keydown', key); return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); }; }, []);
  return <div className="menu-wrap" ref={ref}><button className="icon-btn more" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}><Ellipsis /></button>{open && <div className="action-menu" role="menu">{items.map((item, index) => <button key={`${item.label}-${index}`} role="menuitem" className={`${item.danger ? 'danger-text' : ''} ${item.divider ? 'divider' : ''}`} disabled={item.disabled} onClick={() => { item.onClick(); setOpen(false); }}>{item.icon}{item.label}</button>)}</div>}</div>;
}

export function Pagination({ page, limit, total, totalPages, onPage, onLimit, noun = 'bookings' }: { page: number; limit: number; total: number; totalPages: number; onPage: (page: number) => void; onLimit: (limit: number) => void; noun?: string }) {
  const range = pageRange(page, limit, total); const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(value => value === 1 || value === totalPages || Math.abs(value - page) <= 1);
  return <footer className="pagination"><label className="pagination__page-size">Rows per page:<select aria-label="Rows per page" value={limit} onChange={event => onLimit(Number(event.target.value))}>{PAGE_SIZE_OPTIONS.map(value => <option key={value}>{value}</option>)}</select></label><span className="pagination__summary">Showing {range.from}-{range.to} of {total} <span className="pagination__noun">{noun}</span></span><div className="pagination__pages"><button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page"><ChevronLeft /></button>{pages.map((value, index) => <span className="pagination__page-item" key={value}>{index > 0 && value - pages[index - 1]! > 1 && <i className="pagination__ellipsis">…</i>}<button className={`page-btn ${value === page ? 'active' : ''}`} onClick={() => onPage(value)} aria-current={value === page ? 'page' : undefined}>{value}</button></span>)}<button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Next page"><ChevronRight /></button></div></footer>;
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) { useEffect(() => { const id = setTimeout(onClose, TOAST_DURATION_MS); return () => clearTimeout(id); }, [onClose]); return <div className="toast" role="status"><Check />{message}<button onClick={onClose} aria-label="Dismiss"><X /></button></div>; }
export function SkeletonRows() { return <>{Array.from({ length: 6 }, (_, index) => <tr className="skeleton-row" key={index}><td colSpan={11}><span /></td></tr>)}</>; }
