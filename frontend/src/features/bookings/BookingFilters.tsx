import { ArrowRight, CalendarDays, RotateCcw, Search } from 'lucide-react';
import type { BookingFilters as Filters, Owner } from '../../types';
import { BookingTypeSelect, OwnerSelect } from '../../components/MultiSelects';

function DateRange({ label, from, to, onFrom, onTo }: {
  label: string; from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void;
}) {
  return <div className="compact-filter date-range-filter">
    <span className="field-label">{label}</span>
    <div className="date-range-control">
      <input aria-label={`${label} start`} type={from ? 'date' : 'text'} placeholder="Start Date" value={from} onFocus={event => { event.currentTarget.type = 'date'; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = 'text'; }} onChange={event => onFrom(event.target.value)} />
      <ArrowRight />
      <input aria-label={`${label} end`} type={to ? 'date' : 'text'} placeholder="End Date" value={to} onFocus={event => { event.currentTarget.type = 'date'; }} onBlur={event => { if (!event.currentTarget.value) event.currentTarget.type = 'text'; }} onChange={event => onTo(event.target.value)} />
      <CalendarDays />
    </div>
  </div>;
}

export function BookingFilters({ filters, owners, bookingTypes, onChange, onReset }: {
  filters: Filters; owners: Owner[]; bookingTypes: string[]; onChange: (patch: Partial<Filters>) => void; onReset: () => void;
}) {
  return <section className="filters">
    <div className="filter-row">
      <DateRange label="Booking Date" from={filters.bookingFrom} to={filters.bookingTo} onFrom={bookingFrom => onChange({ bookingFrom })} onTo={bookingTo => onChange({ bookingTo })} />
      <DateRange label="Travel Date" from={filters.from} to={filters.to} onFrom={from => onChange({ from })} onTo={to => onChange({ to })} />
      <div className="compact-filter">
        <span className="field-label">Booking Owner</span>
        <OwnerSelect owners={owners} value={filters.ownerIds} onChange={ownerIds => onChange({ ownerIds })} />
      </div>
      <div className="compact-filter booking-type-field">
        <span className="field-label">Booking Type</span>
        <BookingTypeSelect options={bookingTypes} value={filters.bookingTypes} onChange={value => onChange({ bookingTypes: value })} />
      </div>
      <label className="reference-search">
        <input
          aria-label="Search bookings"
          placeholder="Search by ID / Lead Pax / Amount"
          value={filters.searchQuery}
          onChange={event => onChange({ searchQuery: event.target.value })}
        />
        <Search />
      </label>
      <button className="reference-reset" onClick={onReset} aria-label="Reset all filters"><RotateCcw /></button>
    </div>
  </section>;
}
