import type {ToolSolutionCard} from '@/lib/toolImplementation';
import styles from './ToolImplementationAdmin.module.css';

export function ToolSolutionCardView({card,compact=false}:{card:ToolSolutionCard;compact?:boolean}){return <div className={compact?styles.solutionContext:styles.commercialSolutionCard}><div><h3>{card.name}</h3>{!compact&&<p>{card.description}</p>}</div>{card.details.length>0&&<dl>{card.details.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value)?<ul>{item.value.map(value=><li key={value}>{value}</li>)}</ul>:item.value}</dd></div>)}</dl>}{card.scopeStatus&&<p className={styles.scopeStatus}><b>Status</b><span>{card.scopeStatus}</span></p>}</div>}
