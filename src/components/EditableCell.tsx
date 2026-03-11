"use client";
import { useState, useRef, useEffect, useCallback } from "react";
type CellType = "text"|"date"|"name"|"hora"|"ot";
interface Props { value:string|number; onChange:(v:string)=>void; type?:CellType; placeholder?:string; align?:"left"|"right"|"center"; }

const RULES: Record<CellType,{ filter?:(v:string)=>string; validate?:(v:string)=>string|null; inputMode?:React.HTMLAttributes<HTMLInputElement>["inputMode"]; maxLength?:number; }> = {
  text: {},
  date: {},
  name: {
    filter: v => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s,.\-']/g,""),
    validate: v => v.trim().length>0&&v.trim().length<2?"Nombre muy corto":null,
    maxLength: 60,
  },
  hora: {
    filter: v => { const d=v.replace(/[^0-9]/g,"").slice(0,4); return d.length<=2?d:d.slice(0,2)+":"+d.slice(2); },
    validate: v => { if(!v||v==="00:00") return null; const m=v.match(/^(\d{1,2}):(\d{2})$/); if(!m) return "Formato HH:MM"; if(Number(m[1])>23) return "Hora inválida"; if(Number(m[2])>59) return "Min inválidos"; return null; },
    inputMode: "numeric", maxLength: 5,
  },
  ot: { filter: v=>v.replace(/[^0-9A-Za-z\-]/g,""), maxLength:20 },
};

export default function EditableCell({ value, onChange, type="text", placeholder="", align="left" }: Props) {
  const [editing,setEditing]   = useState(false);
  const [local,setLocal]       = useState(String(value??""));
  const [flash,setFlash]       = useState<"ok"|"err"|null>(null);
  const [err,setErr]           = useState<string|null>(null);
  const ref                    = useRef<HTMLInputElement>(null);
  const rule                   = RULES[type];

  useEffect(()=>{ setLocal(String(value??"")); },[value]);
  useEffect(()=>{ if(editing&&ref.current){ ref.current.focus(); ref.current.select(); } },[editing]);

  const commit = useCallback(()=>{
    const e = rule.validate?.(local)??null;
    if(e){ setErr(e); setFlash("err"); setTimeout(()=>{ setFlash(null);setErr(null); },1800); setLocal(String(value??"")); setEditing(false); return; }
    setEditing(false);
    if(local!==String(value??"")){ onChange(local); setFlash("ok"); setTimeout(()=>setFlash(null),700); }
  },[local,value,onChange,rule]);

  const bg = flash==="ok"?"rgba(74,222,128,0.10)":flash==="err"?"rgba(248,113,113,0.10)":"transparent";
  const ta = align==="right"?"text-right":align==="center"?"text-center":"text-left";

  if(editing) return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <input ref={ref} type={type==="date"?"date":"text"} value={local}
        onChange={e=>setLocal(rule.filter?rule.filter(e.target.value):e.target.value)}
        onBlur={commit}
        onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();commit();} if(e.key==="Escape"){setLocal(String(value??"")); setEditing(false);} }}
        inputMode={rule.inputMode} maxLength={rule.maxLength} placeholder={placeholder}
        className={`cell-in ${ta}`} autoComplete="off" spellCheck={false} />
      {err&&<div style={{position:"absolute",top:"calc(100% + 2px)",left:0,zIndex:99,padding:"3px 8px",borderRadius:4,fontSize:10,whiteSpace:"nowrap",background:"#1a1a2e",color:"#f87171",border:"1px solid rgba(248,113,113,0.3)"}}>⚠ {err}</div>}
    </div>
  );

  return (
    <div onClick={()=>setEditing(true)} className={ta}
      style={{width:"100%",height:"100%",minHeight:36,padding:"0 10px",display:"flex",alignItems:"center",cursor:"text",userSelect:"none",background:bg,transition:flash?"none":"background 0.6s"}}>
      {value!==""&&value!==null&&value!==undefined
        ?<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--t1)"}}>{String(value)}</span>
        :<span style={{color:"var(--t3)",fontSize:11}}>{placeholder||"—"}</span>}
    </div>
  );
}
