export const money=(value:number,currency='INR')=>new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(Math.abs(value));
export const financialYearRange=(date=new Date())=>{const year=date.getMonth()<3?date.getFullYear()-1:date.getFullYear();return{from:`${year}-04-01`,to:`${year+1}-03-31`};};
export const pageRange=(page:number,limit:number,total:number)=>({from:total?((page-1)*limit)+1:0,to:Math.min(page*limit,total)});
export const toggleValue=<T,>(items:T[],value:T)=>items.includes(value)?items.filter((item)=>item!==value):[...items,value];
