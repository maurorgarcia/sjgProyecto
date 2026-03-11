"use client";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import type { TimeError } from "@/types";
import { deleteByFecha, deleteAll } from "@/lib/supabase";

interface Props { onImport:(rows:Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">[])=>Promise<void>; currentFecha:string; onReset?:()=>void; }

const HMAP: Record<string,keyof TimeError> = {
  fecha:"fecha","día":"dia",dia:"dia",contrato:"contrato","nro contrato":"contrato","n° contrato":"contrato",
  "apellido y nombre":"empleado",nombre:"empleado",empleado:"empleado","nombre completo":"empleado",
  motivo:"motivo","motivo error":"motivo",
  "área / sector":"sector","area / sector":"sector","área/sector":"sector","area/sector":"sector",sector:"sector","área":"sector",area:"sector","area de trabajo":"sector","área de trabajo":"sector",
  ot:"ot","ot em.":"ot_em","ot em":"ot_em","ot em.2":"ot_em2","ot em2":"ot_em2",
  "hh nor.":"hh_normales","hh nor":"hh_normales","hh normales":"hh_normales","hs normales":"hh_normales",
  "hh e.50%":"hh_50","hh 50%":"hh_50","hs 50%":"hh_50",
  "hh e.100%":"hh_100","hh 100%":"hh_100","hs 100%":"hh_100",
  estado:"estado",observaciones:"observaciones",obs:"observaciones",insa:"insa",polu:"polu",noct:"noct",
};

function normDate(raw:unknown):string {
  if(!raw) return new Date().toISOString().slice(0,10);
  if(typeof raw==="number"){ const d=XLSX.SSF.parse_date_code(raw); return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`; }
  if(typeof raw==="string"){ const m=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; return raw.slice(0,10); }
  return new Date().toISOString().slice(0,10);
}
function toHHMM(raw:unknown):string {
  if(raw===""||raw===null||raw===undefined) return "00:00";
  if(typeof raw==="number"){ const mins=raw<1?Math.round(raw*24*60):Math.round(raw*60); return `${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`; }
  if(typeof raw==="string"){ const t=raw.trim(); const m=t.match(/^(\d{1,2}):(\d{2})/); if(m) return `${String(Number(m[1])).padStart(2,"0")}:${m[2]}`; const n=parseFloat(t); if(!isNaN(n)) return toHHMM(n); }
  return "00:00";
}
function parseHC(raw:unknown):{hora:string;comp:"insa"|"polu"|"noct"|null} {
  if(raw===""||raw===null||raw===undefined) return {hora:"00:00",comp:null};
  if(typeof raw==="number") return {hora:toHHMM(raw),comp:null};
  if(typeof raw==="string"){ const t=raw.trim().toUpperCase(); const comp=t.includes("INSA")?"insa":t.includes("POLU")?"polu":t.includes("NOCT")?"noct":null; const hm=t.match(/(\d{1,2}:\d{2})/); if(hm) return {hora:toHHMM(hm[1]),comp}; const n=parseFloat(raw); if(!isNaN(n)) return {hora:toHHMM(n),comp}; }
  return {hora:"00:00",comp:null};
}
function normMotivo(raw:unknown):string {
  if(!raw) return "";
  const t=String(raw).toLowerCase().trim();
  if(t.includes("par")||t.includes("incompleto")||t.includes("fichada")) return "Par de fichada incompleto";
  if(t.includes("omis")||t.includes("ausencia")) return "Omisión";
  if(t.includes("saldo")||t.includes("insuf")) return "Saldo Insuficiente";
  if(t.includes("ot")&&(t.includes("inexist")||t.includes("no exist"))) return "OT inexistente";
  if(t.includes("falta parte")||t.includes("sin parte")) return "Falta parte";
  if(t.includes("falta cargar")||t.includes("sin cargar")) return "Falta cargar";
  return String(raw).trim();
}
function normSector(raw:unknown):string {
  if(!raw) return "";
  const t=String(raw).trim();
  const map:Record<string,string>={ "pañol/logistica":"Pañol/Logística","pañol/logística":"Pañol/Logística","panol/logistica":"Pañol/Logística","logistica":"Pañol/Logística","logística":"Pañol/Logística","coordinacion":"Coordinación","coordinación":"Coordinación","puesto fijo":"Puesto Fijo" };
  return map[t.toLowerCase()]??t;
}

type Mode = "replace_date"|"replace_all"|"append";

export default function ImportExcel({ onImport, currentFecha, onReset }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading,setLoading] = useState(false);
  const [menu,setMenu]       = useState(false);
  const [confirm,setConfirm] = useState<"date"|"all"|null>(null);

  const process = async (file:File, mode:Mode) => {
    setLoading(true); setMenu(false);
    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf,{type:"array",cellDates:false});
      const raw: Record<string,unknown>[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
      if(!raw.length){ toast.error("Archivo vacío"); return; }
      const mapped = raw.map(r=>{
        const o:Record<string,unknown>={};
        for(const [k,v] of Object.entries(r)){ const mk=HMAP[k.toLowerCase().trim()]; if(mk) o[mk]=v; }
        return o;
      });
      const rows = mapped.map(r=>{
        const nor=parseHC(r.hh_normales), e50=parseHC(r.hh_50), e100=parseHC(r.hh_100);
        let insa=toHHMM(r.insa),polu=toHHMM(r.polu),noct=toHHMM(r.noct);
        const applyC=(comp:"insa"|"polu"|"noct"|null,hora:string)=>{ if(!comp||hora==="00:00") return; if(comp==="insa"&&insa==="00:00") insa=hora; if(comp==="polu"&&polu==="00:00") polu=hora; if(comp==="noct"&&noct==="00:00") noct=hora; };
        applyC(nor.comp,nor.hora); applyC(e50.comp,e50.hora); applyC(e100.comp,e100.hora);
        return { fecha:normDate(r.fecha), contrato:String(r.contrato??""), empleado:String(r.empleado??""), motivo:normMotivo(r.motivo), sector:normSector(r.sector), ot:String(r.ot??""), ot_em:String(r.ot_em??""), ot_em2:String(r.ot_em2??""), hh_normales:nor.hora, hh_50:e50.hora, hh_100:e100.hora, estado:(["Pendiente","En revisión","Corregido"].includes(String(r.estado))?r.estado:"Pendiente") as "Pendiente"|"En revisión"|"Corregido", observaciones:String(r.observaciones??""), insa, polu, noct };
      });
      if(mode==="replace_all"){ await deleteAll(); toast("Base limpiada",{icon:"🗑️"}); }
      else if(mode==="replace_date"){ const fechas=Array.from(new Set(rows.map(r=>r.fecha))); await Promise.all(fechas.map(f=>deleteByFecha(f))); }
      await onImport(rows);
      toast.success(`${rows.length} registros importados`);
    } catch(e){ console.error(e); toast.error("Error al procesar archivo"); }
    finally{ setLoading(false); if(ref.current) ref.current.value=""; }
  };

  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{ const f=e.target.files?.[0]; if(f) process(f,"replace_date"); }}/>

      {confirm&&(
        <div className="overlay" style={{zIndex:200}}>
          <div className="modal anim" style={{maxWidth:400}}>
            <div className="modal-head">
              <p style={{fontWeight:600,color:"var(--red)"}}>⚠ Confirmar eliminación</p>
              <button onClick={()=>setConfirm(null)} className="btn btn-ghost" style={{padding:"0 8px"}}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>
                {confirm==="all"?"Se eliminarán TODOS los registros de la base de datos.":
                  `Se eliminarán todos los registros del ${currentFecha}.`}
                <br/><strong style={{color:"var(--t1)"}}>Esta acción no se puede deshacer.</strong>
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={async()=>{ setConfirm(null); setLoading(true); try{ if(confirm==="all"){await deleteAll();toast.success("Base limpiada");}else{await deleteByFecha(currentFecha);toast.success("Fecha eliminada");} onReset?.(); }catch{toast.error("Error");} finally{setLoading(false);} }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"relative",display:"flex"}}>
        <button className="btn btn-ghost" disabled={loading} onClick={()=>ref.current?.click()}
          style={{borderRadius:"7px 0 0 7px",borderRight:"none"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {loading?"Importando…":"Importar Excel"}
        </button>
        <button className="btn btn-ghost" disabled={loading} onClick={()=>setMenu(m=>!m)}
          style={{borderRadius:"0 7px 7px 0",padding:"0 8px"}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        {menu&&<>
          <div style={{position:"fixed",inset:0,zIndex:40}} onClick={()=>setMenu(false)}/>
          <div style={{position:"absolute",right:0,top:"calc(100% + 4px)",zIndex:50,background:"var(--bg-card)",border:"1px solid var(--border-hi)",borderRadius:10,overflow:"hidden",minWidth:280,boxShadow:"0 16px 48px rgba(0,0,0,0.6)"}}>
            <div style={{padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <p style={{padding:"4px 14px 8px",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--t3)"}}>Importar Excel</p>
              {[
                {label:"Reemplazar por fecha",desc:"Borra los registros de cada fecha antes de importar. Evita duplicados.",icon:"🔄",mode:"replace_date" as Mode,color:"var(--green)"},
                {label:"Agregar sin reemplazar",desc:"Agrega sin tocar los existentes.",icon:"➕",mode:"append" as Mode,color:"var(--accent-2)"},
              ].map(({label,desc,icon,mode,color})=>(
                <label key={mode} style={{display:"flex",gap:12,padding:"8px 14px",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-hover)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <input type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>{ setMenu(false); const f=e.target.files?.[0]; if(f) process(f,mode); }}/>
                  <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                  <div><p style={{fontSize:12,fontWeight:500,color}}>{label}</p><p style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{desc}</p></div>
                </label>
              ))}
            </div>
            <div style={{padding:"8px 0"}}>
              <p style={{padding:"4px 14px 8px",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--t3)"}}>Limpiar datos</p>
              {[
                {label:`Eliminar fecha ${currentFecha}`,type:"date" as const,color:"#fbbf24"},
                {label:"Restablecer todo",type:"all" as const,color:"var(--red)"},
              ].map(({label,type,color})=>(
                <button key={type} onClick={()=>{setMenu(false);setConfirm(type);}}
                  style={{display:"flex",gap:12,padding:"8px 14px",width:"100%",background:"transparent",border:"none",cursor:"pointer",transition:"background 0.1s",textAlign:"left"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-hover)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <span style={{fontSize:12}}>🗑️</span>
                  <span style={{fontSize:12,fontWeight:500,color}}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>}
      </div>
    </>
  );
}
