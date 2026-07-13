import { CalendarDays, ChevronDown, MoreHorizontal, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../components/AppShell';
import { SummaryCards } from '../../components/SummaryCards';
import { ConfirmModal, Pagination, Toast } from '../../components/ui';
import { localErrorMessage, localRepository } from '../../data/localRepository';
import type { Booking, BookingFilters as Filters, TabKey } from '../../types';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchBookings, fetchFoundation } from '../../app/store';
import { BookingFilters } from './BookingFilters';
import { EditBookingModal, PaymentModal } from './BookingForms';
import { BookingsTable, type BookingAction, type BookingDocumentType } from './BookingsTable';
import { parseBookingCsv } from '../../utils/csv';

type HeaderActionMode = 'default' | 'select' | 'upload';

export function BookingsPage() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(storeState => storeState.bookings);
  const navigate = useNavigate();
  const [active, setActive] = useState<{ action: BookingAction; booking: Booking } | null>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [headerActionMode, setHeaderActionMode] = useState<HeaderActionMode>('default');

  const reload = useCallback(() => { void dispatch(fetchBookings()); }, [dispatch]);
  useEffect(() => { reload(); }, [reload, state.filters]);

  const change = (patch: Partial<Filters>) => {
    dispatch({ type: 'filters/set', payload: patch });
  };

  const mutate = async (operation: () => { message: string }) => {
    setBusy(true);
    try {
      await Promise.resolve();
      const result = operation();
      setToast(result.message);
      setActive(null);
      await Promise.all([dispatch(fetchBookings()), dispatch(fetchFoundation(true))]);
    } catch (error) { setToast(localErrorMessage(error)); }
    finally { setBusy(false); }
  };

  const action = (kind: BookingAction, booking: Booking) => {
    if (kind === 'ledger') { navigate(`/finance/bookings/${booking.id}/ledger`); return; }
    if (kind === 'link') {
      void Promise.resolve().then(async () => {
        await navigator.clipboard?.writeText(`${location.origin}${localRepository.bookingLink(booking.id)}`);
        setToast('Booking link copied');
      }).catch(error => setToast(localErrorMessage(error, 'Could not copy booking link')));
      return;
    }
    if (kind === 'duplicate') { void mutate(() => localRepository.duplicateBooking(booking.id)); return; }
    if (kind === 'restore') { void mutate(() => localRepository.restoreBooking(booking.id)); return; }
    setActive({ action: kind, booking });
  };

  const confirm = () => {
    if (!active) return;
    const operations: Partial<Record<BookingAction, () => { message: string }>> = {
      approve: () => localRepository.approveBooking(active.booking.id),
      delete: () => localRepository.deleteBooking(active.booking.id),
      reject: () => localRepository.rejectBooking(active.booking.id, 'Booking requires changes'),
      resend: () => localRepository.resendBooking(active.booking.id),
    };
    const operation = operations[active.action];
    if (operation) void mutate(operation);
  };

  const uploadBookings = async (file:File) => {
    setBusy(true);
    try {
      const bookings=parseBookingCsv(await file.text(),state.options.bookingTypes);
      const result=localRepository.importBookings(bookings);
      setToast(result.message);setHeaderActionMode('default');
      await Promise.all([dispatch(fetchBookings()),dispatch(fetchFoundation(true))]);
    } catch(error){setToast(localErrorMessage(error,'Could not upload bookings'));}
    finally{setBusy(false);}
  };

  const downloadDocument = async (booking:Booking,type:BookingDocumentType) => {
    try {const blob=new Blob([localRepository.bookingDocument(booking.id,type)],{type:'text/plain'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`${booking.bookingId}-${type}.txt`;anchor.click();URL.revokeObjectURL(url);setToast('Document downloaded');}
    catch(error){setToast(localErrorMessage(error,'Could not download document'));}
  };

  const tabs: [TabKey, string][] = [['bookings', 'Bookings'], ['deleted', 'Deleted'], ['approval', 'Waiting for Approval']];
  const selectionMode = headerActionMode === 'select';
  const allVisibleSelected = state.items.length > 0 && state.items.every(booking => state.selected.includes(booking.id));

  return <>
    <Breadcrumbs items={['Home', 'Finance', 'Bookings']} />
    <div className="reference-finance-bar">
      <SummaryCards summary={state.summary} />
      <div className="bookings-header-actions">
        <div className="bookings-header-actions__content">
          {headerActionMode === 'select' ? <>
            <button className="bookings-header-action bookings-header-action--cancel" onClick={() => { dispatch({ type: 'select/set', payload: [] }); setHeaderActionMode('default'); }}>Cancel</button>
            <button className="bookings-header-action" onClick={() => dispatch({ type: 'select/set', payload: allVisibleSelected ? [] : state.items.map(booking => booking.id) })}>{allVisibleSelected ? 'Deselect all' : 'Select all'}</button>
            <button className="bookings-header-action bookings-header-action--bulk" aria-label="Bulk actions"><MoreHorizontal /></button>
          </> : headerActionMode === 'upload' ? <>
            <button className="bookings-header-action bookings-header-action--cancel" onClick={() => setHeaderActionMode('default')}>Cancel</button>
            <label className="bookings-header-action bookings-header-action--upload">
              <Upload />Choose file
              <input className="bookings-header-file-input" type="file" accept=".csv" disabled={busy} aria-label="Choose booking upload file" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadBookings(file); }} />
            </label>
          </> : <div className="more-actions-reference">
            <button onClick={() => setMoreOpen(!moreOpen)}>More Actions <ChevronDown /></button>
            {moreOpen && <div className="reference-action-menu">
              <button onClick={() => { setHeaderActionMode('select'); setMoreOpen(false); }}>Select bookings</button>
              <button onClick={() => { setHeaderActionMode('upload'); setMoreOpen(false); }}>Upload bookings</button>
            </div>}
          </div>}
        </div>
        <button className="calendar-reference" onClick={() => navigate('/finance/bookings/calendar')} aria-label="Open booking calendar"><CalendarDays /></button>
      </div>
    </div>

    <BookingFilters
      filters={state.filters}
      owners={state.owners}
      onChange={change}
      bookingTypes={state.options.bookingTypes}
      onReset={() => change({ searchQuery: '', bookingTypes: [], ownerIds: [], bookingFrom: '', bookingTo: '', from: '', to: '', page: 1 })}
    />

    <section className="table-card">
      <header className="table-toolbar">
        <div className="tabs" role="tablist">
          {tabs.filter(([key]) => key !== 'approval' || state.session?.permissions.includes('bookings.approve')).map(([key, label]) =>
            <button role="tab" aria-selected={state.filters.tab === key} className={state.filters.tab === key ? 'active' : ''} key={key} onClick={() => change({ tab: key, page: 1 })}>{label}</button>
          )}
        </div>
        {state.filters.tab === 'approval' && <select className="approval-status-filter" aria-label="Approval status" value={state.filters.approvalStatus} onChange={event => change({ approvalStatus: event.target.value })}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>}
        <div className="toolbar-options">
          <label className="toggle"><input type="checkbox" checked={state.filters.showIncomplete} onChange={event => change({ showIncomplete: event.target.checked })} /><span />Show Incomplete Bookings</label>
          <b className="reference-total">Total&nbsp; {state.meta.total}</b>
        </div>
      </header>

      <BookingsTable
        items={state.items}
        owners={state.owners}
        tab={state.filters.tab}
        selected={state.selected}
        selectionMode={selectionMode}
        loading={state.loading}
        onSelect={id => dispatch({ type: 'select/toggle', payload: id })}
        onSelectAll={() => dispatch({ type: 'select/set', payload: state.items.every(booking => state.selected.includes(booking.id)) ? [] : state.items.map(booking => booking.id) })}
        onAction={action}
        onDocument={(booking,type)=>void downloadDocument(booking,type)}
        onSort={field => change({ sortField: field, sortDirection: state.filters.sortField === field && state.filters.sortDirection === 'asc' ? 'desc' : 'asc' })}
      />
      {state.error && <div className="inline-error">{state.error}<button onClick={reload}>Retry</button></div>}
      <Pagination {...state.meta} onPage={page => change({ page })} onLimit={limit => change({ limit, page: 1 })} />
    </section>

    {active?.action === 'edit' && <EditBookingModal booking={active.booking} onClose={() => setActive(null)} onSave={data => mutate(() => localRepository.updateBooking(active.booking.id, data))} />}
    {active?.action === 'payment' && <PaymentModal booking={active.booking} paymentModes={state.options.paymentModes} accounts={state.options.accounts} onClose={() => setActive(null)} onSave={data => mutate(() => localRepository.recordBookingPayment(active.booking.id, data))} />}
    {active && ['approve', 'delete', 'reject', 'resend'].includes(active.action) && <ConfirmModal title={active.action === 'approve' ? 'Approve booking' : active.action === 'delete' ? 'Delete booking' : active.action === 'reject' ? 'Reject booking' : 'Send for approval'} body={active.action === 'approve' ? `Are you sure you want to approve this booking with ID '${active.booking.bookingId}' ?` : active.action === 'reject' ? `Are you sure you want to reject this booking with ID '${active.booking.bookingId}' ?` : active.action === 'resend' ? `Are you sure you want to send booking with ID '${active.booking.bookingId}' for approval?` : `Are you sure you want to delete booking '${active.booking.bookingId}'?`} confirmLabel={active.action === 'approve' ? 'Yes, Approve' : active.action === 'reject' ? 'Yes, Reject' : active.action === 'resend' ? 'Yes, Send for Approval' : 'Delete booking'} danger={active.action === 'reject' || active.action === 'delete'} success={active.action === 'approve'} compact={active.action === 'approve' || active.action === 'reject'} loading={busy} onClose={() => setActive(null)} onConfirm={confirm} />}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </>;
}
