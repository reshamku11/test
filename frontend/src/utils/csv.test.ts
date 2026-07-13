import {describe,expect,it} from 'vitest';
import {parseBookingCsv} from './csv';

describe('booking CSV parser',()=>{
  it('parses required booking columns',()=>{const rows=parseBookingCsv('bookingId,leadPax,travelDate,serviceType,amount\nOS-1,"A Guest",2026-08-01,Flight,24580',['Flight']);expect(rows[0]).toMatchObject({bookingId:'OS-1',leadPax:'A Guest',serviceType:'Flight',amount:24580});});
  it('rejects unsupported services',()=>expect(()=>parseBookingCsv('bookingId,leadPax,travelDate,serviceType,amount\nOS-1,A Guest,2026-08-01,Unknown,10',['Flight'])).toThrow('row 2'));
});
