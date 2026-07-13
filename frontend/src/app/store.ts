import {applyMiddleware,combineReducers,legacy_createStore as createStore} from 'redux';
import {thunk,type ThunkDispatch} from 'redux-thunk';
import type {AnyAction} from 'redux';
import {DEFAULT_PAGE_SIZE,PAGE_SIZE_OPTIONS} from '../config';
import {localErrorMessage,localRepository} from '../data/localRepository';
import type {AppOptions,Booking,BookingFilters,Meta,Owner,SessionUser} from '../types';

export const defaultBookingFilters:BookingFilters={tab:'bookings',approvalStatus:'all',searchField:'all',searchQuery:'',bookingTypes:[],ownerIds:[],bookingFrom:'',bookingTo:'',from:'',to:'',showIncomplete:false,sortField:'updatedAt',sortDirection:'asc',page:1,limit:DEFAULT_PAGE_SIZE};
interface BookingsState{items:Booking[];owners:Owner[];summary:{currency:string;youGive:number;youGet:number;net:number};session:SessionUser|null;options:AppOptions;foundationLoaded:boolean;foundationLoading:boolean;filters:BookingFilters;meta:Meta;selected:string[];loading:boolean;error:string|null;requestId:number}
const initialState:BookingsState={items:[],owners:[],summary:{currency:'INR',youGive:0,youGet:0,net:0},session:null,options:{bookingTypes:[],paymentModes:[],accounts:[],pageSizes:[...PAGE_SIZE_OPTIONS]},foundationLoaded:false,foundationLoading:false,filters:defaultBookingFilters,meta:{page:1,limit:DEFAULT_PAGE_SIZE,total:0,totalPages:1},selected:[],loading:false,error:null,requestId:0};

type FoundationPayload={owners:Owner[];summary:BookingsState['summary'];session:SessionUser;options:AppOptions};
type BookingsAction=
  |{type:'filters/set';payload:Partial<BookingFilters>}
  |{type:'load/start';payload:number}
  |{type:'load/success';payload:{id:number;items:Booking[];meta:Meta}}
  |{type:'load/error';payload:{id:number;message:string}}
  |{type:'foundation/start'}
  |{type:'foundation/set';payload:FoundationPayload}
  |{type:'foundation/error'}
  |{type:'select/toggle';payload:string}
  |{type:'select/set';payload:string[]};

const bookingsReducer=(state:BookingsState=initialState,action:BookingsAction):BookingsState=>{
  switch(action.type){
    case'filters/set':return{...state,filters:{...state.filters,...action.payload,page:action.payload.page??1},selected:[]};
    case'load/start':return{...state,loading:true,error:null,requestId:action.payload};
    case'load/success':return action.payload.id!==state.requestId?state:{...state,loading:false,items:action.payload.items,meta:action.payload.meta};
    case'load/error':return action.payload.id!==state.requestId?state:{...state,loading:false,error:action.payload.message};
    case'foundation/start':return{...state,foundationLoading:true};
    case'foundation/set':return{...state,...action.payload,foundationLoaded:true,foundationLoading:false};
    case'foundation/error':return{...state,foundationLoading:false};
    case'select/toggle':return{...state,selected:state.selected.includes(action.payload)?state.selected.filter(id=>id!==action.payload):[...state.selected,action.payload]};
    case'select/set':return{...state,selected:action.payload};
    default:return state;
  }
};

export const rootReducer=combineReducers({bookings:bookingsReducer});
export const store=createStore(rootReducer,undefined,applyMiddleware(thunk));
export type RootState=ReturnType<typeof rootReducer>;
export type AppDispatch=ThunkDispatch<RootState,unknown,AnyAction>;

let requestCounter=0;
export const fetchBookings=()=>async(dispatch:AppDispatch,getState:()=>RootState)=>{
  const id=++requestCounter;dispatch({type:'load/start',payload:id});
  try{await Promise.resolve();const result=localRepository.queryBookings(getState().bookings.filters);dispatch({type:'load/success',payload:{id,items:result.items,meta:result.meta}});}
  catch(error){dispatch({type:'load/error',payload:{id,message:localErrorMessage(error,'Could not load bookings')}});}
};

export const fetchFoundation=(force=false)=>async(dispatch:AppDispatch,getState:()=>RootState)=>{
  const state=getState().bookings;if(!force&&(state.foundationLoaded||state.foundationLoading))return;dispatch({type:'foundation/start'});
  try{await Promise.resolve();dispatch({type:'foundation/set',payload:localRepository.foundation()});}
  catch{dispatch({type:'foundation/error'});}
};
