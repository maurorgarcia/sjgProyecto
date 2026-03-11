"use client";
import { useState, useRef, useEffect } from "react";
import type { TimeError } from "@/types";

export default function ComplementEditor({ row, onSave }: { row:TimeError; onSave:(v:{insa:string;polu:string;noct:string})=>void }) {
  const [open,setOpen]   = useState(false);
  const [insa,setInsa]   = useState(row.insa||"00:00");
  const [polu,setPolu]   = useState(row.polu||"00:00");
  const [noct,setNoct]   = useState(row.noct||"00:00");
  const [pos,setPos]     = useState({top:0,left:0});
  const btnRef           = useRef<HTMLButtonElement>(null);

  useEffect(()=>{ setInsa(row.insa||"00:00"); setPolu(row.polu||"00:00"); setNoct(row.noct||"00:00"); },[row.insa,row.polu,row.noct]);

  const has = (v:string) => v&&v!=="00:00";
  const any = has(row.insa)||has(row.polu)||has(row.noct);

  const open_ = ()=>{
    if(!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom+4, left: Math.min(r.left, window.innerWidth-220) });
    setOpen(true);
  };

  const COMP = [
    {label:"INSA",val:insa,set:setInsa,color:"#fbbf24"},
    {label:"POLU",val:polu,set:setPolu,color:"#60a5fa"},
    {label:"NOCT",val:noct,set:setNoct,color:"#a78bfa"},
  ];

  return (
    <>
      <button ref={btnRef} onClick={open_}
        style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap",width:"100%",height:"100%",padding:"0 8px",background:"transparent",border:"none",cursor:"pointer"}}>
        {has(row.insa)&&<span style={{padding:"1px 6px",borderRadius:99,fontSize:10,fontWeight:600,background:"rgba(251,191,36,0.12)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.25)"}}>INSA {row.insa}</span>}
        {has(row.polu)&&<span style={{padding:"1px 6px",borderRadius:99,fontSize:10,fontWeight:600,background:"rgba(96,165,250,0.12)",color:"#60a5fa",border:"1px solid rgba(96,165,250,0.25)"}}>POLU {row.polu}</span>}
        {has(row.noct)&&<span style={{padding:"1px 6px",borderRadius:99,fontSize:10,fontWeight:600,background:"rgba(167,139,250,0.12)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.25)"}}>NOCT {row.noct}</span>}
        {!any&&<span style={{fontSize:11,color:"var(--t3)",display:"flex",alignItems:"center",gap:3}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>agregar
        </span>}
      </button>

      {open&&<>
        <div style={{position:"fixed",inset:0,zIndex:100}} onClick={()=>setOpen(false)}/>
        <div style={{position:"fixed",top:pos.top,left:pos.left,zIndex:101,background:"var(--bg-card)",border:"1px solid var(--border-hi)",borderRadius:10,padding:16,minWidth:210,boxShadow:"0 12px 40px rgba(0,0,0,0.6)"}}>
          <p style={{fontSize:10,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--t3)",marginBottom:12}}>Complementos</p>
          {COMP.map(({label,val,set,color})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:10,fontWeight:700,width:36,color}}>{label}</span>
              <input type="text" value={val}
                onChange={e=>set(e.target.value)}
                onFocus={e=>{ if(e.target.value==="00:00") set(""); }}
                onBlur={e=>{ if(!e.target.value.trim()) set("00:00"); }}
                className="form-input" style={{width:80,textAlign:"center"}} placeholder="00:00" />
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={()=>{onSave({insa,polu,noct});setOpen(false);}}>Guardar</button>
            <button className="btn btn-ghost" style={{padding:"0 12px"}} onClick={()=>setOpen(false)}>✕</button>
          </div>
        </div>
      </>}
    </>
  );
}
