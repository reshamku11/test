import { addDays, format, startOfDay } from 'date-fns';
import {
  ArrowRight,
  Building2,
  BusFront,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleArrowDown,
  CircleArrowUp,
  Clock3,
  Filter,
  Globe2,
  History,
  Pencil,
  PlaneTakeoff,
  Repeat2,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Breadcrumbs } from '../../components/AppShell';
import { BookingTypeSelect, OwnerSelect } from '../../components/MultiSelects';
import { SummaryCards } from '../../components/SummaryCards';
import { ActionMenu } from '../../components/ui';
import { localRepository } from '../../data/localRepository';
import type { Booking } from '../../types';
import { CALENDAR_DAYS, CALENDAR_HOURS } from '../../config';


type CalendarStatus = 'completed' | 'ontrip' | 'upcoming' | 'cancelled';

function bookingStatus(booking: Booking): CalendarStatus {
  if (booking.bookingStatus === 'cancelled') return 'cancelled';
  if (new Date(booking.travelEndDate) < startOfDay(new Date())) return 'completed';
  if (new Date(booking.travelDate) <= new Date()) return 'ontrip';
  return 'upcoming';
}

function serviceMeta(serviceType: string): { label: string; icon: ReactNode } {
  if (serviceType === 'Flight') return { label: 'Flight', icon: <PlaneTakeoff /> };
  if (serviceType === 'Accommodation') return { label: 'Hotel', icon: <Building2 /> };
  if (serviceType === 'Transportation (Land)') return { label: 'Transport', icon: <BusFront /> };
  if (serviceType === 'Limitless') return { label: 'UAE', icon: <Globe2 /> };
  return { label: serviceType, icon: <Globe2 /> };
}

function compactRoute(route: string) {
  const codes: Record<string, string> = { Delhi: 'DEL', Singapore: 'SIN', Mumbai: 'BOM', Dubai: 'DXB' };
  return route.split(/\s*(?:→|â†’|->)\s*/).map(place => codes[place] ?? place.slice(0, 3).toUpperCase()).join(' → ');
}

function DateRangeField({ label, from, to, onFrom, onTo }: {
  label: string;
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return <div className="calendar-filter-field calendar-date-field">
    <span>{label}</span>
    <div className="calendar-date-control">
      <input aria-label={`${label} start`} type={from ? 'date' : 'text'} placeholder="Start Date" value={from} onFocus={event => { event.currentTarget.type = 'date'; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = 'text'; }} onChange={event => onFrom(event.target.value)} />
      <ArrowRight />
      <input aria-label={`${label} end`} type={to ? 'date' : 'text'} placeholder="End Date" value={to} onFocus={event => { event.currentTarget.type = 'date'; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = 'text'; }} onChange={event => onTo(event.target.value)} />
      <CalendarDays />
    </div>
  </div>;
}

function CalendarBookingCard({ booking, onOpen, onLedger }: { booking: Booking; onOpen: () => void; onLedger: () => void }) {
  const state = bookingStatus(booking);
  const service = serviceMeta(booking.serviceType);
  return <article className={`calendar-booking-card calendar-booking-card--${state}`}>
    <div className="calendar-booking-card__top">
      <i className="calendar-status-dot" />
      <button className="calendar-booking-id" onClick={onOpen}>{booking.bookingId}</button>
      <span className="calendar-service-icon">{service.icon}</span>
      <strong>{service.label}</strong>
      <ActionMenu items={[{ label: 'Open booking', onClick: onOpen }, { label: 'Customer ledger', onClick: onLedger }]} />
    </div>
    <div className="calendar-booking-card__meta">
      <Clock3 />
      <time>{booking.startTime}</time>
      <span>{booking.serviceType === 'Limitless' ? 'Explore UAE' : booking.serviceType === 'Accommodation' ? '4 Star' : booking.serviceType === 'Transportation (Land)' ? 'Hotel Transfer' : compactRoute(booking.route)}</span>
    </div>
  </article>;
}

export function CalendarPage() {
  const navigate = useNavigate();
  const summary = useAppSelector(state => state.bookings.summary);
  const owners = useAppSelector(state => state.bookings.owners);
  const options = useAppSelector(state => state.bookings.options);
  const [start, setStart] = useState(startOfDay(new Date()));
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingFrom, setBookingFrom] = useState('');
  const [bookingTo, setBookingTo] = useState('');
  const [travelFrom, setTravelFrom] = useState('');
  const [travelTo, setTravelTo] = useState('');
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [bookingTypes, setBookingTypes] = useState<string[]>([]);
  const [searchField, setSearchField] = useState<'bookingId' | 'leadPax'>('bookingId');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => Array.from({ length: CALENDAR_DAYS }, (_, index) => addDays(start, index)), [start]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.resolve();
      setItems(localRepository.calendar(start.toISOString(), addDays(start, CALENDAR_DAYS).toISOString()));
    } catch {
      setError('Could not load the booking timeline.');
    } finally {
      setLoading(false);
    }
  }, [start]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!calendarMenuRef.current?.contains(event.target as Node)) setCalendarMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCalendarMenuOpen(false); };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const filteredItems = useMemo(() => items.filter(booking => {
    const query = searchQuery.trim().toLowerCase();
    if (query && !String(booking[searchField]).toLowerCase().includes(query)) return false;
    if (ownerIds.length && !booking.ownerIds.some(ownerId => ownerIds.includes(ownerId))) return false;
    if (bookingTypes.length && !bookingTypes.includes(booking.bookingType)) return false;
    if (bookingFrom && booking.bookingDate.slice(0, 10) < bookingFrom) return false;
    if (bookingTo && booking.bookingDate.slice(0, 10) > bookingTo) return false;
    if (travelFrom && booking.travelDate.slice(0, 10) < travelFrom) return false;
    if (travelTo && booking.travelDate.slice(0, 10) > travelTo) return false;
    return true;
  }), [bookingFrom, bookingTo, bookingTypes, items, ownerIds, searchField, searchQuery, travelFrom, travelTo]);

  const statusCounts = useMemo(() => filteredItems.reduce<Record<CalendarStatus, number>>((counts, booking) => {
    counts[bookingStatus(booking)] += 1;
    return counts;
  }, { completed: 0, ontrip: 0, upcoming: 0, cancelled: 0 }), [filteredItems]);
  const calendarIndex = useMemo(() => {
    const byDay = new Map<string, Booking[]>(); const bySlot = new Map<string, Booking[]>();
    filteredItems.forEach(booking => { const day = booking.travelDate.slice(0, 10); byDay.set(day, [...(byDay.get(day) ?? []), booking]); const slot = `${day}-${Number(booking.startTime.slice(0, 2))}`; bySlot.set(slot, [...(bySlot.get(slot) ?? []), booking]); });
    return { byDay, bySlot };
  }, [filteredItems]);

  const resetFilters = () => {
    setBookingFrom(''); setBookingTo(''); setTravelFrom(''); setTravelTo('');
    setOwnerIds([]); setBookingTypes([]); setSearchField('bookingId'); setSearchQuery('');
  };

  return <div className="booking-calendar-page">
    <Breadcrumbs items={['Home', 'Finance', 'Bookings', 'Booking Calendar']} />

    <div className="calendar-overview">
      <SummaryCards summary={summary} />
      <div className="calendar-quick-menu" ref={calendarMenuRef}>
        <button className="calendar-route-button" aria-label="Open calendar actions" aria-expanded={calendarMenuOpen} aria-haspopup="menu" title="Calendar actions" onClick={() => setCalendarMenuOpen(open => !open)}><CalendarDays /></button>
        {calendarMenuOpen && <div className="calendar-quick-menu__panel" role="menu">
          <button role="menuitem" className="is-got" onClick={() => setCalendarMenuOpen(false)}><CircleArrowDown />You Got</button>
          <button role="menuitem" className="is-gave" onClick={() => setCalendarMenuOpen(false)}><CircleArrowUp />You Gave</button>
          <button role="menuitem" onClick={() => setCalendarMenuOpen(false)}><History />Reschedule</button>
          <button role="menuitem" onClick={() => setCalendarMenuOpen(false)}><Repeat2 />Change Status</button>
          <button role="menuitem" className="is-edit" onClick={() => setCalendarMenuOpen(false)}><Pencil />Edit</button>
          <button role="menuitem" className="is-delete" onClick={() => setCalendarMenuOpen(false)}><Trash2 />Delete</button>
        </div>}
      </div>
    </div>

    <section className="calendar-page-filters" aria-label="Calendar filters">
      <DateRangeField label="Booking Date" from={bookingFrom} to={bookingTo} onFrom={setBookingFrom} onTo={setBookingTo} />
      <DateRangeField label="Travel Date" from={travelFrom} to={travelTo} onFrom={setTravelFrom} onTo={setTravelTo} />
      <div className="calendar-filter-field calendar-owner-field"><span>Booking Owner</span><OwnerSelect owners={owners} value={ownerIds} onChange={setOwnerIds} /></div>
      <div className="calendar-filter-field calendar-type-field"><span>Booking Type</span><BookingTypeSelect options={options.bookingTypes} value={bookingTypes} onChange={setBookingTypes} /></div>
      <div className="calendar-search-control">
        <label>
          <select aria-label="Calendar search field" value={searchField} onChange={event => setSearchField(event.target.value as 'bookingId' | 'leadPax')}>
            <option value="bookingId">Booking ID</option><option value="leadPax">Lead Pax</option>
          </select>
          <ChevronDown />
        </label>
        <input aria-label="Search calendar" placeholder="Type here" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
        <Search />
      </div>
      <button className="calendar-reset-button" onClick={resetFilters} aria-label="Reset calendar filters"><RotateCcw /></button>
    </section>

    <div className="calendar-filter-action-row">
      <h1 className="calendar-timeline-title">Bookings Timeline</h1>
      <button className="calendar-filter-button"><Filter />Filter</button>
    </div>

    <section className="booking-timeline-card">
      <header className="booking-timeline-toolbar">
        <div className="calendar-range-controls">
          <button onClick={() => setStart(addDays(start, -CALENDAR_DAYS))} aria-label="Previous date range"><ChevronLeft /></button>
          <strong>{format(days[0]!, "dd MMM ''yy")} – {format(days[days.length - 1]!, "dd MMM ''yy")}</strong>
          <button onClick={() => setStart(addDays(start, CALENDAR_DAYS))} aria-label="Next date range"><ChevronRight /></button>
          <span className="calendar-total"><em>Total</em>{filteredItems.length}</span>
        </div>
        <div className="calendar-legend" aria-label="Booking status legend">
          <span><i className="completed" /><em>Completed</em>{statusCounts.completed}</span>
          <span><i className="ontrip" /><em>On Trip</em>{statusCounts.ontrip}</span>
          <span><i className="upcoming" /><em>Upcoming</em>{statusCounts.upcoming}</span>
          <span><i className="cancelled" /><em>Cancelled</em>{statusCounts.cancelled}</span>
        </div>
      </header>

      {error && <div className="calendar-page-error">{error}<button onClick={() => void load()}>Retry</button></div>}
      <div className="booking-timeline-scroll">
        <div className="booking-timeline-grid" style={{ '--calendar-days': days.length } as React.CSSProperties}>
          <div className="calendar-time-head" />
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayItems = calendarIndex.byDay.get(key) ?? [];
            const limitless = dayItems.filter(booking => booking.bookingType === 'Limitless').length;
            return <div className={`calendar-day-head ${key === format(new Date(), 'yyyy-MM-dd') ? 'is-today' : ''}`} key={key}>
              <span>{format(day, 'EEE')}, <b>{format(day, 'dd MMM')}</b></span>
              <div><i>OS&nbsp; {dayItems.length - limitless}</i><i>Limitless&nbsp; {limitless}</i></div>
            </div>;
          })}
          {CALENDAR_HOURS.map(hour => <div className="calendar-time-row" key={hour}>
            <div className="calendar-time-label">{format(new Date(2026, 0, 1, hour), 'HH:mm')}</div>
            {days.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const bookings = calendarIndex.bySlot.get(`${dayKey}-${hour}`) ?? [];
              return <div className="calendar-time-cell" key={dayKey}>{bookings.map(booking => <CalendarBookingCard key={booking.id} booking={booking} onOpen={() => navigate('/finance/bookings')} onLedger={() => navigate(`/finance/customers/${booking.customerId}/ledger`)} />)}</div>;
            })}
          </div>)}
          <div className="calendar-current-line" aria-hidden="true" />
          {loading && <div className="calendar-page-loading">Loading timeline…</div>}
        </div>
      </div>
    </section>
  </div>;
}
