import {
  Bell, BookOpen, BriefcaseBusiness, ChevronRight, CircleDollarSign,
  FileCheck2, FolderKanban, LayoutGrid, Menu, Search, Settings, Users, X,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchFoundation } from '../app/store';

const primaryNavigation = [
  { label: 'Dashboard', icon: LayoutGrid },
  { label: 'Sales', icon: FolderKanban, expandable: true },
  { label: 'Operations', icon: BriefcaseBusiness, expandable: true },
  { label: 'Bookings', icon: BookOpen },
  { label: 'Approvals', icon: FileCheck2, expandable: true },
  { label: 'Content', icon: FolderKanban },
  { label: 'Finance', icon: CircleDollarSign, expandable: true, href: '/finance/bookings' },
  { label: 'Directory', icon: Users, expandable: true },
  { label: 'Reports', icon: FileCheck2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.bookings.session);
  useEffect(() => { void dispatch(fetchFoundation()); }, [dispatch]);

  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <span>ciergo</span>
        <button className="sidebar-collapse icon-btn" aria-label="Collapse navigation">◫</button>
        <button className="mobile-close icon-btn" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
      </div>
      <nav aria-label="Main navigation">
        {primaryNavigation.map(({ label, icon: Icon, expandable, href }) =>
          <Link
            to={href ?? '#'}
            key={label}
            className={label === 'Finance' && location.pathname.includes('/finance/') ? 'active' : ''}
          >
            <Icon />
            <span>{label}</span>
            {expandable && <ChevronRight className="nav-caret" />}
          </Link>
        )}
      </nav>
      <Link className="sidebar-settings" to="#"><Settings />Settings<ChevronRight /></Link>
    </aside>
    {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <div className="main">
      <header className="topbar">
        <button className="hamburger icon-btn" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
        <div className="global-search">
          <Search />
          <input aria-label="Global search" placeholder="Search or type command..." />
          <kbd>⌘</kbd><kbd>K</kbd>
        </div>
        <div className="top-actions">
          <button className="icon-btn notification" aria-label="Notifications"><Bell /><i /></button>
          <div className="user">
            <span className="avatar user-photo">{session?.avatar ?? 'YM'}</span>
            <div><b>{session?.name ?? 'Yash Manocha'}</b><span>{session?.role ?? 'Sales Lead'}</span></div>
          </div>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  </div>;
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">
    <span className="breadcrumb-home">⌂</span>
    {items.slice(1).map((item, index) => <span key={item}>{index > 0 && <em>/</em>}{item}</span>)}
  </nav>;
}
