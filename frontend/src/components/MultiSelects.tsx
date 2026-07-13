import { Check, ChevronDown, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Owner } from '../types';
import { toggleValue } from '../utils/finance';

function Popover({ label, count, children }: { label: string; count: number; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="filter-popover">
    <button className={`filter-control ${count ? 'selected' : ''}`} onClick={() => setOpen(!open)}>{label}{count > 0 && <b>{count}</b>}<ChevronDown /></button>
    {open && <div className="popover-panel">{children(() => setOpen(false))}</div>}
  </div>;
}

export function BookingTypeSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (value: string[]) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <Popover label="All Bookings" count={value.length}>{close => <>
    <div className="popover-head"><div><h3>Booking Type</h3><span>{draft.length} selected</span></div><button className="icon-btn" onClick={close} aria-label="Close booking type filter"><X /></button></div>
    <button className="select-all" onClick={() => setDraft(draft.length === options.length ? [] : options)}><span className={`checkbox ${draft.length ? 'checked' : ''}`}>{draft.length === options.length && <Check />}</span>{draft.length === options.length ? 'Deselect All' : 'Select All'}</button>
    <span className="group-label">OTHER SERVICES</span>
    {options.filter(type => type !== 'Limitless').map(type => <label className="check-row" key={type}><input type="checkbox" checked={draft.includes(type)} onChange={() => setDraft(toggleValue(draft, type))} /><span className="fake-check"><Check /></span>{type}</label>)}
    {options.includes('Limitless') && <><span className="group-label">LIMITLESS</span><label className="check-row"><input type="checkbox" checked={draft.includes('Limitless')} onChange={() => setDraft(toggleValue(draft, 'Limitless'))} /><span className="fake-check"><Check /></span>Limitless</label></>}
    <div className="popover-actions"><button className="btn text" onClick={() => setDraft([])}>Reset</button><button className="btn primary" disabled={JSON.stringify(draft) === JSON.stringify(value)} onClick={() => { onChange(draft); close(); }}>Apply</button></div>
  </>}</Popover>;
}

function OwnerChips({ owners, selected, onChange }: { owners: Owner[]; selected: string[]; onChange: (value: string[]) => void }) {
  return <div className="owner-selected-chips">{selected.map(id => { const owner = owners.find(candidate => candidate.id === id); return owner && <span key={id}><button aria-label={`Remove ${owner.name}`} onClick={() => onChange(selected.filter(candidate => candidate !== id))}><X /></button>{owner.name}</span>; })}</div>;
}

function OwnerPicker({ owners, selected, onChange, label = 'Search / Select Owners' }: { owners: Owner[]; selected: string[]; onChange: (value: string[]) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="owner-picker">
    <button className="owner-picker__control" aria-expanded={open} onClick={() => setOpen(value => !value)}>{label}<ChevronDown /></button>
    {open && <div className="owner-picker__options">{owners.map(owner => <label key={owner.id}><input type="checkbox" checked={selected.includes(owner.id)} onChange={() => onChange(toggleValue(selected, owner.id))} />{owner.name}</label>)}</div>}
    <OwnerChips owners={owners} selected={selected} onChange={onChange} />
  </div>;
}

export function OwnerSelect({ owners, value, onChange }: { owners: Owner[]; value: string[]; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [primary, setPrimary] = useState(value);
  const [secondary, setSecondary] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const combined = [...new Set([...primary, ...secondary])];

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);

  const togglePanel = () => {
    if (!open && JSON.stringify([...combined].sort()) !== JSON.stringify([...value].sort())) { setPrimary(value); setSecondary([]); }
    setOpen(current => !current);
  };
  const toggleAdvanced = (enabled: boolean) => {
    if (!enabled) { setPrimary([...new Set([...primary, ...secondary])]); setSecondary([]); }
    setAdvanced(enabled);
  };

  return <div className="filter-popover owner-select" ref={ref}>
    <button className={`filter-control ${value.length ? 'selected' : ''}`} aria-expanded={open} onClick={togglePanel}>Search / Select Owners{value.length > 0 && <b>{value.length}</b>}<ChevronDown /></button>
    {open && <div className={`owner-select-panel ${advanced ? 'is-advanced' : ''}`}>
      <header className="owner-select-panel__header">
        <strong>Select Booking Owners</strong>
        <label><input type="checkbox" checked={advanced} onChange={event => toggleAdvanced(event.target.checked)} />Advanced Search</label>
        <button onClick={() => setOpen(false)} aria-label="Close owner filter"><X /></button>
      </header>

      {advanced ? <div className="owner-advanced-grid">
        <section><div><strong>Primary Owner(s)</strong><span>{primary.length} Owner(s) Selected</span></div><OwnerPicker owners={owners} selected={primary} onChange={setPrimary} /></section>
        <section><div><strong>Secondary Owner(s)</strong><span>{secondary.length} Owner(s) Selected</span></div><OwnerPicker owners={owners} selected={secondary} onChange={setSecondary} /></section>
      </div> : <div className="owner-basic-picker">
        <span>{primary.length} Owner(s) Selected</span>
        <OwnerPicker owners={owners} selected={primary} onChange={setPrimary} />
      </div>}

      <footer className="owner-select-panel__actions">
        <button className="owner-reset" aria-label="Reset booking owners" onClick={() => { setPrimary([]); setSecondary([]); }}><RotateCcw /></button>
        <button className="owner-apply" onClick={() => { onChange(combined); setOpen(false); }}>Apply</button>
      </footer>
    </div>}
  </div>;
}
