export type TabKey='bookings'|'deleted'|'approval'; export type ApprovalStatus='not_required'|'pending'|'approved'|'rejected';
export interface Owner{id:string;name:string;email:string;avatar:string;role:string}
export interface Booking{id:string;bookingId:string;customerId:string;leadPax:string;bookingDate:string;travelDate:string;travelEndDate:string;serviceType:string;bookingType:string;bookingStatus:string;approvalStatus:ApprovalStatus;approvalRequired:boolean;paymentStatus:string;amount:number;customerAmount:number;vendorAmount:number;currency:string;ownerIds:string[];primaryOwnerIds:string[];secondaryOwnerIds:string[];voucherStatus:string;taskCount:number;isIncomplete:boolean;deletedAt:string|null;rejectionReason?:string;createdAt:string;updatedAt:string;startTime:string;route:string}
export interface LedgerEntry{id:string;entryId:string;customerId:string;bookingId?:string;entryType:string;serviceType:string;transactionDate:string;travelDate?:string;status:string;paymentMode:string;account:string;amount:number;signedAmount:number;closingBalance:number;reference?:string;notes?:string}
export interface Customer{id:string;customerId:string;name:string;email:string;phone:string;currency:string}
export interface Meta{page:number;limit:number;total:number;totalPages:number}
export interface ApiResponse<T>{success:boolean;message:string;data:T;meta?:Meta}
export interface SessionUser{id:string;name:string;role:string;avatar:string;permissions:string[]}
export interface AppOptions{bookingTypes:string[];paymentModes:string[];accounts:string[];pageSizes:number[]}
export interface BookingFilters{tab:TabKey;approvalStatus:string;searchField:'all'|'bookingId'|'leadPax'|'amount';searchQuery:string;bookingTypes:string[];ownerIds:string[];bookingFrom:string;bookingTo:string;from:string;to:string;showIncomplete:boolean;sortField:string;sortDirection:'asc'|'desc';page:number;limit:number}
