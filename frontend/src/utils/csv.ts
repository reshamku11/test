export interface BookingUploadRow { bookingId:string; leadPax:string; travelDate:string; serviceType:string; amount:number }

function csvRows(text:string):string[][] {
  const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
  for(let index=0;index<text.length;index+=1){const char=text[index];if(char==='"'){if(quoted&&text[index+1]==='"'){cell+='"';index+=1;}else quoted=!quoted;}else if(char===','&&!quoted){row.push(cell.trim());cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index+=1;row.push(cell.trim());cell='';if(row.some(Boolean))rows.push(row);row=[];}else cell+=char;}
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}

export function parseBookingCsv(text:string,allowedTypes:string[]):BookingUploadRow[]{
  const [header,...rows]=csvRows(text);if(!header)throw new Error('The CSV file is empty.');
  const normalized=header.map(value=>value.toLowerCase().replace(/[ _-]/g,''));
  const required=['bookingid','leadpax','traveldate','servicetype','amount'];
  const indexes=required.map(name=>normalized.indexOf(name));if(indexes.some(index=>index<0))throw new Error('CSV headers must include bookingId, leadPax, travelDate, serviceType, and amount.');
  const result=rows.map((values,rowIndex)=>{const [bookingIndex,leadIndex,dateIndex,serviceIndex,amountIndex]=indexes;const bookingId=values[bookingIndex!]??'';const leadPax=values[leadIndex!]??'';const date=values[dateIndex!]??'';const serviceType=values[serviceIndex!]??'';const amount=Number((values[amountIndex!]??'').replace(/[,₹\s]/g,''));const parsedDate=new Date(date);if(!bookingId||!leadPax||Number.isNaN(parsedDate.getTime())||!allowedTypes.includes(serviceType)||!Number.isFinite(amount)||amount<=0)throw new Error(`Invalid booking data on CSV row ${rowIndex+2}.`);return{bookingId,leadPax,travelDate:parsedDate.toISOString(),serviceType,amount};});
  if(!result.length)throw new Error('The CSV file has no booking rows.');return result;
}
