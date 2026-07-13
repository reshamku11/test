import {ArrowDownLeft,ArrowUpRight,Calculator} from 'lucide-react';
import {money} from '../utils/finance';

export function SummaryCards({summary}:{summary:{currency:string;youGive:number;youGet:number;net:number}}){
  const cards=[{label:'Net',value:summary.net,icon:<Calculator/>,tone:summary.youGet>summary.youGive?'green':'red',hint:'You Get − You Give'},{label:'You Give',value:summary.youGive,icon:<ArrowUpRight/>,tone:'red',hint:'Pending payables'},{label:'You Get',value:summary.youGet,icon:<ArrowDownLeft/>,tone:'green',hint:'Pending receivables'}];
  return <div className="summary-grid">{cards.map(card=><article className="summary-card" key={card.label}><span className={`summary-icon ${card.tone}`}>{card.icon}</span><div><span>{card.label}</span><strong className={card.tone}>{card.label==='Net'?'':card.value<0?'-':''}{money(card.value,summary.currency)}</strong><small>{card.hint}</small></div></article>)}</div>;
}
