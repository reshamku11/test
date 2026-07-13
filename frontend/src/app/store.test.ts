import {describe,expect,it} from 'vitest';
import {rootReducer,store} from './store';

describe('bookings reducer',()=>{
  it('initializes for Redux internal actions',()=>expect(store.getState().bookings.filters.limit).toBe(6));
  it('resets page and selection when filters change',()=>{const loaded=rootReducer(undefined,{type:'select/set',payload:['book-1']});const changed=rootReducer(loaded,{type:'filters/set',payload:{searchQuery:'Anand'}});expect(changed.bookings.filters.page).toBe(1);expect(changed.bookings.selected).toEqual([]);});
  it('ignores stale request results',()=>{const loading=rootReducer(undefined,{type:'load/start',payload:2});const stale=rootReducer(loading,{type:'load/success',payload:{id:1,items:[],meta:{page:1,limit:6,total:0,totalPages:1}}});expect(stale.bookings.loading).toBe(true);expect(stale.bookings.requestId).toBe(2);});
});
