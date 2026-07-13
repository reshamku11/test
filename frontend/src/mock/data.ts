import type { Booking, Customer, LedgerEntry, Owner, SessionUser } from '../types';

const date = (days: number) => new Date(Date.UTC(2026, 6, 13 + days, 10)).toISOString();

const ownerRows: Array<[string, string, string]> = [
  ['own-1', 'Harshit Roy', 'HR'],
  ['own-2', 'Harsh Sharma', 'HS'],
  ['own-3', 'Harshita Roy', 'HR'],
  ['own-4', 'Ajay Kumar', 'AK'],
  ['own-5', 'Ajay Thakur', 'AT'],
  ['own-6', 'Ajay Sharma', 'AS'],
];

export const mockOwners: Owner[] = ownerRows.map(([id, name, avatar]) => ({
  id,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@ciergo.test`,
  avatar,
  role: 'Consultant',
}));

export const mockSession: SessionUser = {
  id: 'current-admin',
  name: 'Yash Manocha',
  role: 'Sales Lead',
  avatar: 'YM',
  permissions: ['bookings.view', 'bookings.approve', 'bookings.edit', 'bookings.delete', 'payments.create'],
};

export const mockCustomers: Customer[] = [{
  id: 'cust-1',
  customerId: 'CUST-1001',
  name: 'Anand Mishra',
  email: 'anand@example.com',
  phone: '+91 98765 43210',
  currency: 'INR',
}];

const names = ['Anand Mishra', 'Sumit Jha', 'Zaheer', 'Gaurav Kapoor', 'Shirish Pandey', 'Ravi Sharma', 'Arjun Verma', 'Karan Singh', 'Irfan Khan', 'Vikram Mehta'];
const originalBookingIds = ['OS-ABC12', 'OS-ABC13', 'LI-ABC12', 'OS-ABC14', 'OS-ABC15', 'OS-ABC16', 'OS-ABC17', 'LI-ABC18', 'OS-ABC19', 'OS-ABC20', 'LI-ABC21', 'OS-ABC22'];
const bookingIds = Array.from({ length: 60 }, (_, index) => originalBookingIds[index] ?? `${index % 7 === 0 ? 'LI' : 'OS'}-${String(index + 101).padStart(5, '0')}`);
const services = ['Flight', 'Accommodation', 'Limitless', 'Transportation (Land)', 'Flight', 'Flight', 'Activity', 'Ticket (Attraction)', 'Travel Insurance', 'Others', 'Accommodation', 'Flight'];
const customerAmounts = [0, 18500, 18800, 19000, 0, 19150];
const vendorAmounts = [0, 17000, 17500, 18000, 0, 18180];

export const mockBookings: Booking[] = bookingIds.map((bookingId, index) => {
  const approvalStatus = index === 6 ? 'pending' : index === 8 ? 'rejected' : index === 10 ? 'approved' : index % 3 === 0 ? 'not_required' : 'approved';
  const referenceDate = index < 6
    ? new Date(Date.UTC(2026, 2, index === 0 || index === 5 ? 6 : 5, 10)).toISOString()
    : date((index - 6) % 10);
  const serviceType = services[index % services.length] ?? 'Others';
  return {
    id: `book-${index + 1}`,
    bookingId,
    customerId: 'cust-1',
    leadPax: names[index % names.length] ?? 'Guest',
    bookingDate: date(-18 + index),
    travelDate: referenceDate,
    travelEndDate: referenceDate,
    serviceType,
    bookingType: serviceType,
    bookingStatus: index === 9 ? 'incomplete' : 'confirmed',
    approvalStatus,
    approvalRequired: approvalStatus !== 'not_required',
    paymentStatus: index < 6 ? (index === 1 ? 'partial' : index === 0 || index === 4 ? 'paid' : 'pending') : 'paid',
    amount: index < 6 ? 24580 : 18000 + index * 4250,
    customerAmount: index < 6 ? customerAmounts[index] ?? 0 : 20000 + index * 4500,
    vendorAmount: index < 6 ? vendorAmounts[index] ?? 0 : 16000 + index * 3700,
    currency: 'INR',
    ownerIds: [`own-${(index % 6) + 1}`, `own-${((index + 1) % 6) + 1}`, `own-${((index + 2) % 6) + 1}`, `own-${((index + 3) % 6) + 1}`],
    primaryOwnerIds: [`own-${(index % 6) + 1}`],
    secondaryOwnerIds: [`own-${((index + 1) % 6) + 1}`],
    voucherStatus: index % 3 === 0 ? 'available' : 'pending',
    taskCount: index % 5,
    isIncomplete: index === 9,
    deletedAt: index === 7 ? date(1) : null,
    createdAt: date(-30 + index),
    updatedAt: date(index),
    startTime: `${String(8 + (index % 9)).padStart(2, '0')}:00`,
    route: index % 2 ? 'Mumbai → Dubai' : 'Delhi → Singapore',
  };
});

type SeedLedgerEntry = Omit<LedgerEntry, 'closingBalance'>;
const signedAmount = (entryType: string, amount: number) => ['money_received', 'booking_cancelled'].includes(entryType) ? Math.abs(amount) : -Math.abs(amount);
const withBalances = (entries: SeedLedgerEntry[]): LedgerEntry[] => {
  let balance = 0;
  return entries.map(entry => ({ ...entry, closingBalance: (balance += entry.signedAmount) }));
};
const ledgerRows = [
  ['led-1', 'OS-ABC12', 'booking_created', 'Flight', date(-22), 55000],
  ['led-2', 'OS-ABC12', 'money_received', 'Flight', date(-20), 25000],
  ['led-3', 'OS-ABC13', 'booking_created', 'Accommodation', date(-16), 42000],
  ['led-4', 'OS-ABC13', 'money_received', 'Accommodation', date(-10), 20000],
  ['led-5', 'LI-ABC12', 'booking_cancelled', 'Limitless', date(-5), 12000],
  ['led-6', 'OS-ABC14', 'money_paid', 'Transportation (Land)', date(-2), 5000],
] as const;

export const mockLedgerEntries: LedgerEntry[] = withBalances(ledgerRows.map(([entryId, bookingId, entryType, serviceType, transactionDate, amount]) => ({
  id: entryId,
  entryId,
  customerId: 'cust-1',
  bookingId,
  entryType,
  serviceType,
  transactionDate,
  travelDate: transactionDate,
  status: entryType.includes('money') ? 'Completed' : 'Confirmed',
  paymentMode: entryType.includes('money') ? 'Bank transfer' : '—',
  account: entryType.includes('money') ? 'HDFC Current' : 'Sales',
  amount,
  signedAmount: signedAmount(entryType, amount),
  reference: 'CIERGO-DEMO',
})));
