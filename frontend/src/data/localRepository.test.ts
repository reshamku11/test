import { afterEach, describe, expect, it } from 'vitest';
import { defaultBookingFilters } from '../app/store';
import { localRepository, resetLocalData } from './localRepository';

afterEach(resetLocalData);

describe('offline local repository', () => {
  it('shares the expanded dataset between bookings and calendar', () => {
    const bookings = localRepository.queryBookings({ ...defaultBookingFilters, limit: 100 });
    const calendar = localRepository.calendar(
      new Date(Date.UTC(2026, 6, 13)).toISOString(),
      new Date(Date.UTC(2026, 6, 23)).toISOString(),
    );
    expect(bookings.meta.total).toBe(56);
    expect(calendar).toHaveLength(53);
  });

  it('filters, sorts, and paginates bookings without a request', () => {
    const result = localRepository.queryBookings({ ...defaultBookingFilters, searchQuery: 'Anand', limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.items.every(booking => booking.leadPax === 'Anand Mishra')).toBe(true);
    expect(result.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('preserves approval, delete, and restore behavior locally', () => {
    localRepository.approveBooking('book-7');
    expect(localRepository.getBooking('book-7').approvalStatus).toBe('approved');
    localRepository.deleteBooking('book-7');
    expect(localRepository.getBooking('book-7').deletedAt).not.toBeNull();
    localRepository.restoreBooking('book-7');
    expect(localRepository.getBooking('book-7').deletedAt).toBeNull();
  });

  it('adds local ledger payments and recalculates the balance', () => {
    const before = localRepository.ledgerSummary('cust-1').balance;
    localRepository.recordCustomerPayment('cust-1', { direction: 'got', amount: 500, transactionDate: '2026-07-13', paymentMode: 'UPI', account: 'Sales' });
    expect(localRepository.ledgerSummary('cust-1').balance).toBe(before + 500);
    expect(localRepository.exportLedger('cust-1', { from: '', to: '', pendingOnly: false }).some(entry => entry.paymentMode === 'UPI')).toBe(true);
  });

  it('generates documents and valid local share routes', () => {
    expect(localRepository.bookingDocument('book-1', 'booking-voucher')).toContain('OS-ABC12');
    expect(localRepository.shareLedgerPath('cust-1', { pending: true, range: false, from: '', to: '' })).toBe('/finance/customers/cust-1/ledger?pendingOnly=true');
  });
});
