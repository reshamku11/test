# Ciergo Finance Frontend

This project is a fully offline React and TypeScript finance UI. It has no backend server, HTTP client, API proxy, database, or runtime environment dependency.

## Architecture

- `frontend/src/mock/data.ts`: typed production-like owners, bookings, customers, session, and ledger fixtures.
- `frontend/src/data/localRepository.ts`: local query, filter, sort, pagination, mutation, document, and ledger behavior.
- `frontend/src/app/store.ts`: shared Redux bookings/foundation state and local-data thunks.
- `frontend/src/features`: existing bookings, calendar, and ledger pages.
- `frontend/src/components`: existing shared UI components.

## Demo data

The application ships with 60 realistic booking records in one shared dataset. The Finance Bookings table and Booking Calendar both read from that same repository, so edits, approvals, uploads, payments, deletion, restoration, and duplication remain consistent across the two views.

- The main Bookings tab contains roughly 50–60 records after approval and deletion rules are applied.
- The Calendar contains roughly 50–60 non-deleted bookings distributed across its visible ten-day timeline.
- The first six records retain the original reference values used by the approved Finance Bookings design.
- Waiting-for-approval and deleted records remain available in their respective tabs.

Data is mutable for the lifetime of the browser page, so changes immediately affect every route. Refreshing the page restores the original 60-record fixture set.

## Commands

Run all commands from `frontend`:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

The application runs at `http://localhost:5173` and does not require another process.

## Routes

- `/finance/bookings`
- `/finance/bookings/calendar`
- `/finance/bookings/:bookingId/ledger`
- `/finance/customers/:customerId/ledger`

## Offline behavior

Searching, filtering, sorting, pagination, selection, forms, validation, dialogs, dropdowns, notifications, booking actions, calendar data, ledger payments, exports, share-route generation, and text document downloads use local data only. WhatsApp and email buttons still open their normal external URL handlers when explicitly selected; application data never depends on them.
