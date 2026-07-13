import { PAGE_SIZE_OPTIONS } from '../config';
import { mockBookings, mockCustomers, mockLedgerEntries, mockOwners, mockSession } from '../mock/data';
import type { AppOptions, Booking, BookingFilters, LedgerEntry, Meta } from '../types';
import type { BookingUploadRow } from '../utils/csv';

export const localOptions: AppOptions = {
  bookingTypes: ['Flight', 'Accommodation', 'Transportation (Land)', 'Ticket (Attraction)', 'Activity', 'Visa', 'Travel Insurance', 'Others', 'Limitless'],
  paymentModes: ['Bank transfer', 'Cash', 'UPI', 'Card'],
  accounts: ['HDFC Current', 'Sales'],
  pageSizes: [...PAGE_SIZE_OPTIONS],
};

let bookings = structuredClone(mockBookings);
let ledgerEntries = structuredClone(mockLedgerEntries);
const bookingPayments = new Map<string, number>();

export function resetLocalData() {
  bookings = structuredClone(mockBookings);
  ledgerEntries = structuredClone(mockLedgerEntries);
  bookingPayments.clear();
}

const id = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const now = () => new Date().toISOString();
const totalPages = (total: number, limit: number) => Math.max(1, Math.ceil(total / limit));
const customerSignedAmount = (type: string, amount: number) => ['money_received', 'booking_cancelled'].includes(type) ? Math.abs(amount) : -Math.abs(amount);

function summary() {
  const eligible = bookings.filter(booking => !booking.deletedAt && (!booking.approvalRequired || booking.approvalStatus === 'approved'));
  const youGive = eligible.reduce((sum, booking) => sum + Math.max(0, booking.vendorAmount - (booking.paymentStatus === 'paid' ? booking.vendorAmount : 0)), 0);
  const youGet = eligible.reduce((sum, booking) => sum + Math.max(0, booking.customerAmount - (booking.paymentStatus === 'paid' ? booking.customerAmount : 0)), 0);
  return { currency: 'INR', youGive, youGet, net: youGet - youGive };
}

function bookingById(bookingId: string) {
  const booking = bookings.find(value => value.id === bookingId || value.bookingId === bookingId);
  if (!booking) throw new Error('Booking not found');
  return booking;
}

function customerById(customerId: string) {
  const customer = mockCustomers.find(value => value.id === customerId || value.customerId === customerId);
  if (!customer) throw new Error('Customer not found');
  return customer;
}

function recalculateCustomerLedger(customerId: string, newEntry?: Omit<LedgerEntry, 'closingBalance'>) {
  const otherCustomers = ledgerEntries.filter(entry => entry.customerId !== customerId);
  const customerEntries = ledgerEntries.filter(entry => entry.customerId === customerId).map(({ closingBalance, ...entry }) => { void closingBalance; return entry; });
  if (newEntry) customerEntries.push(newEntry);
  customerEntries.sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  let balance = 0;
  ledgerEntries = [...otherCustomers, ...customerEntries.map(entry => ({ ...entry, closingBalance: (balance += entry.signedAmount) }))];
}

export const localRepository = {
  foundation() {
    return { owners: structuredClone(mockOwners), summary: summary(), session: structuredClone(mockSession), options: structuredClone(localOptions) };
  },

  queryBookings(filters: BookingFilters): { items: Booking[]; meta: Meta } {
    const query = filters.searchQuery.trim().toLowerCase();
    let result = bookings.filter(booking => filters.tab === 'deleted' ? Boolean(booking.deletedAt) : !booking.deletedAt);
    if (filters.tab === 'approval') result = result.filter(booking => booking.approvalRequired && (filters.approvalStatus === 'all' || booking.approvalStatus === filters.approvalStatus));
    if (filters.tab === 'bookings') result = result.filter(booking => (!booking.approvalRequired || booking.approvalStatus === 'approved') && (filters.showIncomplete || !booking.isIncomplete));
    if (query) result = result.filter(booking => filters.searchField === 'all'
      ? [booking.bookingId, booking.leadPax, booking.amount].some(value => String(value).toLowerCase().includes(query))
      : String(booking[filters.searchField]).toLowerCase().includes(query));
    if (filters.bookingTypes.length) result = result.filter(booking => filters.bookingTypes.includes(booking.bookingType));
    if (filters.ownerIds.length) result = result.filter(booking => booking.ownerIds.some(ownerId => filters.ownerIds.includes(ownerId)));
    if (filters.bookingFrom) result = result.filter(booking => booking.bookingDate.slice(0, 10) >= filters.bookingFrom);
    if (filters.bookingTo) result = result.filter(booking => booking.bookingDate.slice(0, 10) <= filters.bookingTo);
    if (filters.from) result = result.filter(booking => booking.travelDate.slice(0, 10) >= filters.from);
    if (filters.to) result = result.filter(booking => booking.travelDate.slice(0, 10) <= filters.to);
    result.sort((left, right) => {
      const leftValue = left[filters.sortField as keyof Booking];
      const rightValue = right[filters.sortField as keyof Booking];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
      return comparison * (filters.sortDirection === 'asc' ? 1 : -1);
    });
    const total = result.length;
    return {
      items: structuredClone(result.slice((filters.page - 1) * filters.limit, filters.page * filters.limit)),
      meta: { page: filters.page, limit: filters.limit, total, totalPages: totalPages(total, filters.limit) },
    };
  },

  calendar(from: string, to: string) {
    return structuredClone(bookings.filter(booking => !booking.deletedAt && (!from || booking.travelDate >= from) && (!to || booking.travelDate <= to)));
  },

  getBooking(bookingId: string) { return structuredClone(bookingById(bookingId)); },

  updateBooking(bookingId: string, input: Partial<Pick<Booking, 'leadPax' | 'amount' | 'travelDate'>>) {
    const booking = bookingById(bookingId);
    Object.assign(booking, input, { updatedAt: now() });
    return { message: 'Booking updated', booking: structuredClone(booking) };
  },

  duplicateBooking(bookingId: string) {
    const source = bookingById(bookingId);
    const timestamp = now();
    const duplicate: Booking = { ...structuredClone(source), id: id('book'), bookingId: `${source.bookingId.split('-')[0]}-${id('').slice(-5).toUpperCase()}`, approvalStatus: source.approvalRequired ? 'pending' : 'not_required', paymentStatus: 'pending', deletedAt: null, createdAt: timestamp, updatedAt: timestamp };
    bookings.push(duplicate);
    return { message: 'Booking duplicated', booking: structuredClone(duplicate) };
  },

  approveBooking(bookingId: string) {
    const booking = bookingById(bookingId);
    if (booking.approvalStatus !== 'pending') throw new Error('Only pending bookings can be approved');
    Object.assign(booking, { approvalStatus: 'approved', updatedAt: now() });
    return { message: 'Booking approved' };
  },

  rejectBooking(bookingId: string, reason: string) {
    const booking = bookingById(bookingId);
    if (booking.approvalStatus !== 'pending') throw new Error('Only pending bookings can be rejected');
    Object.assign(booking, { approvalStatus: 'rejected', rejectionReason: reason, updatedAt: now() });
    return { message: 'Booking rejected' };
  },

  resendBooking(bookingId: string) {
    const booking = bookingById(bookingId);
    if (booking.approvalStatus !== 'rejected') throw new Error('Only rejected bookings can be resent');
    Object.assign(booking, { approvalStatus: 'pending', updatedAt: now() });
    return { message: 'Booking sent for approval' };
  },

  deleteBooking(bookingId: string) {
    const booking = bookingById(bookingId);
    if (booking.deletedAt) throw new Error('Booking is already deleted');
    Object.assign(booking, { deletedAt: now(), updatedAt: now() });
    return { message: 'Booking moved to Deleted' };
  },

  restoreBooking(bookingId: string) {
    const booking = bookingById(bookingId);
    if (!booking.deletedAt) throw new Error('Booking is not deleted');
    Object.assign(booking, { deletedAt: null, updatedAt: now() });
    return { message: 'Booking restored' };
  },

  importBookings(rows: BookingUploadRow[]) {
    const existing = new Set(bookings.map(booking => booking.bookingId));
    const duplicate = rows.find(row => existing.has(row.bookingId));
    if (duplicate) throw new Error(`Booking ${duplicate.bookingId} already exists`);
    const timestamp = now();
    rows.forEach(row => bookings.push({ id: id('book'), bookingId: row.bookingId, customerId: 'cust-1', leadPax: row.leadPax, bookingDate: timestamp, travelDate: row.travelDate, travelEndDate: row.travelDate, serviceType: row.serviceType, bookingType: row.serviceType, bookingStatus: 'confirmed', approvalStatus: 'not_required', approvalRequired: false, paymentStatus: 'pending', amount: row.amount, customerAmount: row.amount, vendorAmount: row.amount, currency: 'INR', ownerIds: [], primaryOwnerIds: [], secondaryOwnerIds: [], voucherStatus: 'pending', taskCount: 0, isIncomplete: false, deletedAt: null, createdAt: timestamp, updatedAt: timestamp, startTime: '09:00', route: '' }));
    return { message: `${rows.length} booking(s) uploaded` };
  },

  recordBookingPayment(bookingId: string, input: { amount: number; paymentMode: string; account: string }) {
    const booking = bookingById(bookingId);
    const timestamp = now();
    const paymentId = id('PAY').slice(-10).toUpperCase();
    const paid = (bookingPayments.get(booking.id) ?? 0) + input.amount;
    bookingPayments.set(booking.id, paid);
    booking.paymentStatus = paid >= booking.amount ? 'paid' : 'partial';
    booking.updatedAt = timestamp;
    recalculateCustomerLedger(booking.customerId, { id: id('led'), entryId: paymentId, customerId: booking.customerId, bookingId: booking.bookingId, entryType: 'money_received', serviceType: booking.serviceType, transactionDate: timestamp, travelDate: booking.travelDate, status: 'Completed', paymentMode: input.paymentMode, account: input.account, amount: input.amount, signedAmount: customerSignedAmount('money_received', input.amount) });
    return { message: 'Payment recorded' };
  },

  bookingDocument(bookingId: string, documentType: string) {
    const booking = bookingById(bookingId);
    const titles: Record<string, string> = { 'booking-voucher': 'Booking Voucher', 'customer-invoice': 'Customer Invoice', 'vendor-voucher': 'Vendor Voucher', 'vendor-invoice': 'Vendor Invoice' };
    const title = titles[documentType];
    if (!title) throw new Error('Unsupported booking document type');
    return [title, `Booking: ${booking.bookingId}`, `Lead passenger: ${booking.leadPax}`, `Service: ${booking.serviceType}`, `Travel date: ${booking.travelDate.slice(0, 10)}`, `Amount: ${booking.currency} ${booking.amount}`].join('\n');
  },

  bookingLink(bookingId: string) { return `/finance/bookings/${bookingById(bookingId).id}/ledger`; },

  resolveCustomerForBooking(bookingId: string) { return bookingById(bookingId).customerId; },

  ledger(customerId: string, filters: { from: string; to: string; pendingOnly: boolean; page: number; limit: number }) {
    const customer = customerById(customerId);
    let entries = ledgerEntries.filter(entry => entry.customerId === customer.id);
    if (filters.from) entries = entries.filter(entry => entry.transactionDate.slice(0, 10) >= filters.from);
    if (filters.to) entries = entries.filter(entry => entry.transactionDate.slice(0, 10) <= filters.to);
    if (filters.pendingOnly) entries = entries.filter(entry => entry.status !== 'Completed');
    entries = [...entries].sort((left, right) => right.transactionDate.localeCompare(left.transactionDate));
    const total = entries.length;
    return { customer: structuredClone(customer), entries: structuredClone(entries.slice((filters.page - 1) * filters.limit, filters.page * filters.limit)), meta: { page: filters.page, limit: filters.limit, total, totalPages: totalPages(total, filters.limit) } };
  },

  ledgerSummary(customerId: string) {
    const customer = customerById(customerId);
    const balance = ledgerEntries.filter(entry => entry.customerId === customer.id).reduce((sum, entry) => sum + entry.signedAmount, 0);
    return { balance, label: balance < 0 ? 'You Collect' : 'You Pay', currency: customer.currency };
  },

  exportLedger(customerId: string, filters: { from: string; to: string; pendingOnly: boolean }) {
    return this.ledger(customerId, { ...filters, page: 1, limit: Number.MAX_SAFE_INTEGER }).entries;
  },

  recordCustomerPayment(customerId: string, input: { direction: 'gave' | 'got'; amount: number; transactionDate: string; paymentMode: string; account: string; reference?: string; notes?: string }) {
    const customer = customerById(customerId);
    const entryType = input.direction === 'got' ? 'money_received' : 'money_paid';
    const paymentId = id('PAY').slice(-10).toUpperCase();
    recalculateCustomerLedger(customer.id, { id: id('led'), entryId: paymentId, customerId: customer.id, entryType, serviceType: 'Others', transactionDate: new Date(input.transactionDate).toISOString(), status: 'Completed', paymentMode: input.paymentMode, account: input.account, amount: input.amount, signedAmount: customerSignedAmount(entryType, input.amount), reference: input.reference, notes: input.notes });
    return { message: 'Payment recorded' };
  },

  shareLedgerPath(customerId: string, input: { pending: boolean; range: boolean; from: string; to: string }) {
    const customer = customerById(customerId);
    const query = new URLSearchParams();
    if (input.pending) query.set('pendingOnly', 'true');
    if (input.range && input.from) query.set('from', input.from);
    if (input.range && input.to) query.set('to', input.to);
    return `/finance/customers/${customer.id}/ledger${query.size ? `?${query}` : ''}`;
  },
};

export function localErrorMessage(error: unknown, fallback = 'Something went wrong') {
  return error instanceof Error ? error.message : fallback;
}
