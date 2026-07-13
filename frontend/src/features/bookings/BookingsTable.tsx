import { ArrowDownUp, Building2, BusFront, Check, CheckSquare, ChevronDown, ClipboardList, Copy, Download, Edit3, Link2, ListFilter, PlaneTakeoff, Plus, RotateCcw, Send, SlidersHorizontal, Trash2, UserCheck, UserX, WalletCards, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Booking, Owner, TabKey } from '../../types';
import { money } from '../../utils/finance';
import { ActionMenu, SkeletonRows, type MenuItem } from '../../components/ui';

export type BookingAction = 'edit' | 'delete' | 'link' | 'duplicate' | 'approve' | 'reject' | 'resend' | 'restore' | 'payment' | 'ledger';

const serviceLabel = (service: string) => service === 'Limitless' ? 'Explore UAE' : service === 'Transportation (Land)' ? 'Transportation' : service;

function ServiceCell({ service }: { service: string }) {
  if (service === 'Limitless') return <span className="reference-service reference-service--limitless"><span className="service-country">UAE</span><span className="service-pill">Explore UAE</span></span>;
  const Icon = service === 'Flight' ? PlaneTakeoff : service === 'Accommodation' ? Building2 : BusFront;
  return <span className="reference-service"><Icon aria-hidden="true" /><span>{serviceLabel(service)}</span></span>;
}

function HeaderCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label="Select all visible bookings" />;
}

export type BookingDocumentType = 'booking-voucher'|'customer-invoice'|'vendor-voucher'|'vendor-invoice';
function VoucherMenu({ booking, onDownload }: { booking: Booking; onDownload:(booking:Booking,type:BookingDocumentType)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const documents: Array<[BookingDocumentType,string]> = [['booking-voucher','Booking Voucher(s)'],['customer-invoice','Customer Invoice(s)'],['vendor-voucher','Vendor Voucher(s)'],['vendor-invoice','Vendor Invoice(s)']];
  return <div className="voucher-menu" ref={ref}>
    <button className="voucher-control" aria-label={`Voucher documents for ${booking.bookingId}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(value => !value)}><CheckSquare /><ChevronDown /></button>
    {open && <div className="voucher-menu__panel" role="menu">{documents.map(([type,label]) => <button role="menuitem" key={type} onClick={() => {onDownload(booking,type);setOpen(false);}}><Download />{label}</button>)}</div>}
  </div>;
}

export function BookingsTable({ items, owners, tab, selected, selectionMode, loading, onSelect, onSelectAll, onAction, onDocument, onSort }: {
  items: Booking[]; owners: Owner[]; tab: TabKey; selected: string[]; selectionMode: boolean; loading: boolean;
  onSelect: (id: string) => void; onSelectAll: () => void; onAction: (action: BookingAction, booking: Booking) => void; onDocument:(booking:Booking,type:BookingDocumentType)=>void; onSort: (field: string) => void;
}) {
  const all = items.length > 0 && items.every(booking => selected.includes(booking.id));
  const some = items.some(booking => selected.includes(booking.id));

  const menu = (booking: Booking): MenuItem[] => {
    if (tab === 'deleted') return [
      { label: 'Restore', icon: <RotateCcw />, onClick: () => onAction('restore', booking) },
      { label: 'Duplicate', icon: <Copy />, onClick: () => onAction('duplicate', booking) },
    ];
    if (tab === 'approval' && booking.approvalStatus === 'pending') return [
      { label: 'Approve', icon: <UserCheck />, onClick: () => onAction('approve', booking) },
      { label: 'Reject', icon: <UserX />, danger: true, onClick: () => onAction('reject', booking) },
      { label: 'Edit', icon: <Edit3 />, divider: true, onClick: () => onAction('edit', booking) },
      { label: 'Delete', icon: <Trash2 />, danger: true, onClick: () => onAction('delete', booking) },
      { label: 'Duplicate', icon: <Copy />, onClick: () => onAction('duplicate', booking) },
    ];
    if (tab === 'approval' && booking.approvalStatus === 'rejected') return [
      { label: 'Send for Approval', icon: <Send />, onClick: () => onAction('resend', booking) },
      { label: 'Delete', icon: <Trash2 />, danger: true, divider: true, onClick: () => onAction('delete', booking) },
      { label: 'Duplicate', icon: <Copy />, onClick: () => onAction('duplicate', booking) },
    ];
    return [
      { label: 'Edit', icon: <Edit3 />, onClick: () => onAction('edit', booking) },
      { label: 'Delete', icon: <Trash2 />, danger: true, onClick: () => onAction('delete', booking) },
      { label: 'Copy Link', icon: <Link2 />, divider: true, onClick: () => onAction('link', booking) },
      { label: 'Duplicate', icon: <Copy />, onClick: () => onAction('duplicate', booking) },
    ];
  };

  return <div className="reference-table-wrap">
    <div className="table-scroll bookings-table-scroll">
    <table className={`data-table bookings-data-table ${selectionMode ? 'is-selecting' : ''}`}>
      <colgroup>
        {selectionMode && tab !== 'deleted' && <col className="bookings-col--select" />}
        <col className="bookings-col--booking" />
        <col className="bookings-col--lead" />
        <col className="bookings-col--date" />
        <col className="bookings-col--service" />
        <col className="bookings-col--status" />
        <col className="bookings-col--amount" />
        <col className="bookings-col--owner" />
        <col className="bookings-col--voucher" />
        <col className="bookings-col--tasks" />
        <col className="bookings-col--actions" />
      </colgroup>
      <thead><tr>
        {selectionMode && tab !== 'deleted' && <th className="bookings-cell--select"><HeaderCheckbox checked={all} indeterminate={!all && some} onChange={onSelectAll} /></th>}
        <th>Booking ID</th>
        <th><span className="header-filter">Lead Pax <SlidersHorizontal /></span></th>
        <th><button onClick={() => onSort('travelDate')}>Travel Date <ListFilter /><ArrowDownUp /></button></th>
        <th className="bookings-cell--service"><span className="header-filter">Service <ListFilter /></span></th>
        <th><span className="header-filter">Payment Status <SlidersHorizontal /></span></th>
        <th><button onClick={() => onSort('amount')}>Amount <ArrowDownUp /></button></th>
        <th>Owner</th><th>Voucher</th><th>Tasks</th><th>Actions</th>
      </tr></thead>
      <tbody>
        {loading ? <SkeletonRows /> : items.length === 0 ? <tr><td colSpan={11}><div className="empty-state"><span><WalletCards /></span><h3>No bookings found</h3><p>Try changing or resetting the filters.</p></div></td></tr> : items.map(booking =>
          <tr key={booking.id}>
            {selectionMode && tab !== 'deleted' && <td className="bookings-cell--select"><input type="checkbox" checked={selected.includes(booking.id)} onChange={() => onSelect(booking.id)} aria-label={`Select ${booking.bookingId}`} /></td>}
            <td><button className="booking-id" onClick={()=>onAction('ledger',booking)}>{booking.bookingId}</button></td>
            <td>{booking.leadPax}</td>
            <td>{new Date(booking.travelDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
            <td className="bookings-cell--service"><ServiceCell service={booking.serviceType} /></td>
            <td><span className={`badge ${booking.paymentStatus}`}>{booking.paymentStatus === 'partial' ? 'Partially Paid' : booking.paymentStatus}</span></td>
            <td><strong className="amount">{money(booking.amount, booking.currency)}</strong></td>
            <td><div className="avatar-stack">{booking.ownerIds.slice(0, 4).map((id, index) => { const owner = owners.find(value => value.id === id); return <span className={`avatar owner-tone-${index + 1}`} title={owner?.name} key={id}>{owner?.avatar ?? '?'}</span>; })}</div></td>
            <td>{tab === 'approval' && booking.approvalStatus === 'rejected' ? '—' : <VoucherMenu booking={booking} onDownload={onDocument} />}</td>
            <td>{tab === 'approval' && booking.approvalStatus === 'rejected' ? '—' : <button className={`task-control ${booking.taskCount ? 'has-tasks' : 'is-empty'}`} aria-label={`${booking.taskCount} tasks`}>{booking.taskCount ? <ClipboardList aria-hidden="true" /> : <Plus aria-hidden="true" />}{booking.taskCount > 0 && <sup>{booking.taskCount}</sup>}</button>}</td>
            <td><div className="row-actions">{tab === 'approval' && booking.approvalStatus === 'pending' ? <><button className="approval-row-action approval-row-action--approve" aria-label={`Approve ${booking.bookingId}`} onClick={() => onAction('approve', booking)}><Check /></button><button className="approval-row-action approval-row-action--reject" aria-label={`Reject ${booking.bookingId}`} onClick={() => onAction('reject', booking)}><X /></button></> : (tab === 'bookings' || (tab === 'approval' && booking.approvalStatus === 'approved')) && <button className="icon-btn payment-btn" aria-label="Record payment" onClick={() => onAction('payment', booking)}>₹</button>}<ActionMenu items={menu(booking)} /></div></td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  </div>;
}
