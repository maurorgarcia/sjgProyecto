"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  flexRender, createColumnHelper, type ColumnDef, type FilterFn, type SortingState } from "@tanstack/react-table";
import toast from "react-hot-toast";
import { supabase, fetchTimeErrors, insertTimeError, updateTimeError,
  deleteTimeError, duplicateTimeError, bulkInsertTimeErrors } from "@/lib/supabase";
import type { TimeError, FilterState, Estado } from "@/types";
import EditableCell from "./EditableCell";
import StatusBadge from "./StatusBadge";
import ImportExcel from "./ImportExcel";
import ExportExcel from "./ExportExcel";
import AddRowModal from "./AddRowModal";
import HistoryModal from "./HistoryModal";
import ComplementEditor from "./ComplementEditor";
import Header from "./Header";
import Footer from "./Footer";
import { SelectDropdown } from "./SelectDropdown";

const MOTIVOS   = ["Par de fichada incompleto","Omisión","Saldo Insuficiente","OT inexistente","Falta parte","Falta cargar"];
const CONTRATOS = ["6700248017","6700302926"];
const SECTORES  = ["Mecánica","Eléctrica","Instrumentos","Civil","Aislación","Pintura","Andamios","Pañol/Logística","Coordinación","Puesto Fijo","RRHH","Administración"];
const FALTANTES = new Set(["Falta parte","Falta cargar"]);

function diaES(fecha:string) {
  if(!fecha) return "—";
  const d = new Date(fecha+"T12:00:00");
  const n = d.toLocaleDateString("es-AR",{weekday:"long"});
  return n.charAt(0).toUpperCase()+n.slice(1,3);
}

function SortIcon({dir}:{dir:"asc"|"desc"|false}) {
  if(!dir) return <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" style={{opacity:0.2}}><path d="M4 0L8 4H0z"/><path d="M4 10L0 6h8z"/></svg>;
  return <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" style={{color:"var(--accent)",transform:dir==="desc"?"rotate(180deg)":"none"}}><path d="M4 0L8 5H0z"/></svg>;
}
function SH({col,label}:{col:any;label:string}) {
  return col.getCanSort()
    ? <div onClick={col.getToggleSortingHandler()} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap"}}>{label}<SortIcon dir={col.getIsSorted()}/></div>
    : <span style={{whiteSpace:"nowrap"}}>{label}</span>;
}

const gff: FilterFn<TimeError> = (row,_,f:FilterState) => {
  if(f.fecha&&row.original.fecha!==f.fecha) return false;
  if(f.estado&&row.original.estado!==f.estado) return false;
  if(f.sector&&!row.original.sector?.toLowerCase().includes(f.sector.toLowerCase())) return false;
  if(f.motivo&&row.original.motivo!==f.motivo) return false;
  if(f.search&&!row.original.empleado?.toLowerCase().includes(f.search.toLowerCase())) return false;
  if(f.soloFaltantes&&!FALTANTES.has(row.original.motivo)) return false;
  return true;
};

// ── Sector cell with autocomplete ──
function SectorCell({value,onChange}:{value:string;onChange:(v:string)=>void}) {
  const [editing,setEditing] = useState(false);
  const [local,setLocal]     = useState(value);
  const [flash,setFlash]     = useState(false);
  const ref                  = useRef<HTMLInputElement>(null);
  useEffect(()=>setLocal(value),[value]);
  useEffect(()=>{ if(editing&&ref.current){ref.current.focus();ref.current.select();} },[editing]);
  const commit = ()=>{
    setEditing(false);
    if(local!==value){onChange(local);setFlash(true);setTimeout(()=>setFlash(false),700);}
  };
  const suggs = SECTORES.filter(s=>local.trim()&&s.toLowerCase().includes(local.toLowerCase())&&s.toLowerCase()!==local.toLowerCase()).slice(0,5);
  if(editing) return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <input ref={ref} value={local} onChange={e=>setLocal(e.target.value)}
        onBlur={()=>setTimeout(commit,120)}
        onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();commit();} if(e.key==="Escape"){setLocal(value);setEditing(false);} }}
        className="cell-in" placeholder="Sector…" autoComplete="off"/>
      {suggs.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,zIndex:50,width:"100%",background:"var(--bg-card)",border:"1px solid var(--border-hi)",borderTop:"none",borderRadius:"0 0 6px 6px",overflow:"hidden"}}>
          {suggs.map(s=>(
            <div key={s} onMouseDown={()=>{setLocal(s);setTimeout(commit,50);}}
              style={{padding:"6px 10px",fontSize:11,cursor:"pointer",color:"var(--t1)",fontFamily:"'JetBrains Mono',monospace"}}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-hover)")}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div onClick={()=>setEditing(true)}
      style={{width:"100%",height:"100%",minHeight:36,padding:"0 10px",display:"flex",alignItems:"center",cursor:"text",userSelect:"none",background:flash?"rgba(74,222,128,0.08)":"transparent",transition:flash?"none":"background 0.6s"}}>
      {value?<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--t1)",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{value}</span>
            :<span style={{color:"var(--t3)",fontSize:11}}>—</span>}
    </div>
  );
}

// ── Mobile Card ──
function MobileCard({row,onUpdate,onDuplicate,onDelete,onHistory}:{row:TimeError;onUpdate:(id:string,f:keyof TimeError,v:unknown)=>void;onDuplicate:(r:TimeError)=>void;onDelete:(id:string)=>void;onHistory:(r:TimeError)=>void}) {
  const [exp,setExp] = useState(false);
  const borderColor = row.estado==="Corregido"?"var(--green)":row.estado==="En revisión"?"#6366f1":"var(--amber)";
  return (
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hi)",borderLeft:`3px solid ${borderColor}`,borderRadius:10,marginBottom:8,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>
      <div style={{padding:12}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8}}>
          <div style={{minWidth:0,flex:1}}>
            <p style={{fontWeight:600,fontSize:13,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.empleado||"—"}</p>
            <p style={{fontSize:10,color:"var(--t3)",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{row.fecha} · {diaES(row.fecha)} · {row.contrato||"—"}</p>
          </div>
          <StatusBadge value={row.estado as Estado} onChange={v=>onUpdate(row.id,"estado",v)}/>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {row.motivo&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"var(--bg-row)",color:"var(--t2)",border:"1px solid var(--border)"}}>{row.motivo}</span>}
          {row.sector&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"var(--bg-row)",color:"var(--t2)",border:"1px solid var(--border)"}}>{row.sector}</span>}
        </div>
        <div style={{display:"flex",gap:12,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
          {row.hh_normales!=="00:00"&&<span style={{color:"var(--t3)"}}>Nor: <strong style={{color:"var(--t1)"}}>{row.hh_normales}</strong></span>}
          {row.hh_50!=="00:00"&&<span style={{color:"var(--t3)"}}>50%: <strong style={{color:"var(--t1)"}}>{row.hh_50}</strong></span>}
          {row.hh_100!=="00:00"&&<span style={{color:"var(--t3)"}}>100%: <strong style={{color:"var(--t1)"}}>{row.hh_100}</strong></span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,paddingTop:8,borderTop:"1px solid var(--border)"}}>
          <button onClick={()=>setExp(e=>!e)} style={{fontSize:10,fontWeight:600,color:"var(--t3)",background:"none",border:"none",cursor:"pointer"}}>{exp?"▲ Cerrar":"▼ Editar"}</button>
          <div style={{flex:1}}/>
          {[
            {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,title:"Historial",fn:()=>onHistory(row),color:"var(--t3)"},
            {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,title:"Duplicar",fn:()=>onDuplicate(row),color:"var(--t3)"},
            {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>,title:"Eliminar",fn:()=>{if(confirm("¿Eliminar?"))onDelete(row.id);},color:"#f87171"},
          ].map((a,i)=>(
            <button key={i} onClick={a.fn} title={a.title}
              style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,background:"var(--bg-row)",border:"1px solid var(--border)",cursor:"pointer",color:a.color}}>
              {a.icon}
            </button>
          ))}
        </div>
      </div>
      {exp&&(
        <div style={{padding:"12px",borderTop:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Sector",field:"sector"},{label:"OT",field:"ot"},{label:"OT Em.",field:"ot_em"},
            {label:"HH Nor.",field:"hh_normales"},{label:"HH 50%",field:"hh_50"},{label:"HH 100%",field:"hh_100"},
            {label:"INSA",field:"insa"},{label:"POLU",field:"polu"},{label:"NOCT",field:"noct"},
          ].map(({label,field})=>(
            <div key={field}>
              <label style={{display:"block",fontSize:9,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--t3)",marginBottom:4}}>{label}</label>
              <input type="text" defaultValue={String((row as unknown as Record<string,unknown>)[field]??"")}
                onBlur={e=>onUpdate(row.id,field as keyof TimeError,e.target.value)}
                className="form-input" style={{height:30,fontSize:11}}/>
            </div>
          ))}
          <div style={{gridColumn:"1/-1"}}>
            <label style={{display:"block",fontSize:9,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--t3)",marginBottom:4}}>Observaciones</label>
            <textarea defaultValue={row.observaciones||""} onBlur={e=>onUpdate(row.id,"observaciones",e.target.value)}
              rows={2} className="form-input" style={{height:"auto",paddingTop:6,resize:"none"}}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──
const ch = createColumnHelper<TimeError>();

export default function TimeErrorTable() {
  const router = useRouter();
  const [data,setData]           = useState<TimeError[]>([]);
  const [loading,setLoading]     = useState(true);
  const [selected,setSelected]   = useState<Set<string>>(new Set());
  const [addModal,setAddModal]   = useState(false);
  const [histRow,setHistRow]     = useState<TimeError|null>(null);
  const [isMobile,setIsMobile]   = useState(false);
  const [sorting,setSorting]     = useState<SortingState>([{id:"fecha",desc:true}]);
  const [filters,setFilters]     = useState<FilterState>({
    fecha:new Date().toISOString().slice(0,10), estado:"", sector:"", motivo:"", search:"", soloFaltantes:false,
  });

  useEffect(()=>{ const chk=()=>setIsMobile(window.innerWidth<768); chk(); window.addEventListener("resize",chk); return ()=>window.removeEventListener("resize",chk); },[]);

  const load = useCallback(async()=>{
    setLoading(true);
    try{ setData(await fetchTimeErrors()); }
    catch{ toast.error("Error al cargar datos"); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ load(); },[load]);

  useEffect(()=>{
    const ch = supabase.channel("te_rt2")
      .on("postgres_changes",{event:"*",schema:"public",table:"time_errors"},(p)=>{
        if(p.eventType==="INSERT") setData(d=>[p.new as TimeError,...d]);
        else if(p.eventType==="UPDATE") setData(d=>d.map(r=>r.id===(p.new as TimeError).id?p.new as TimeError:r));
        else if(p.eventType==="DELETE") setData(d=>d.filter(r=>r.id!==(p.old as TimeError).id));
      }).subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[]);

  const upd = useCallback(async(id:string,field:keyof TimeError,value:unknown)=>{
    const prev = data.find(r=>r.id===id);
    setData(d=>d.map(r=>r.id===id?{...r,[field]:value}:r));
    try{ await updateTimeError(id,{[field]:value} as Partial<TimeError>,prev?{[field]:(prev as unknown as Record<string,unknown>)[field as string]}:undefined); }
    catch{ toast.error("Error al guardar"); load(); }
  },[data,load]);

  const handleAdd     = useCallback(async(row:Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">)=>{ try{await insertTimeError(row);toast.success("Registro agregado");}catch{toast.error("Error al agregar");} },[]);
  const handleDup     = useCallback(async(row:TimeError)=>{ try{await duplicateTimeError(row);toast.success("Registro duplicado");}catch{toast.error("Error al duplicar");} },[]);
  const handleDel     = useCallback(async(id:string)=>{ try{await deleteTimeError(id);}catch{toast.error("Error al eliminar");} },[]);
  const handleDelSel  = useCallback(async()=>{ if(!selected.size||!confirm(`¿Eliminar ${selected.size} registro(s)?`)) return; await Promise.all(Array.from(selected).map(handleDel)); setSelected(new Set()); },[selected,handleDel]);
  const handleImport  = useCallback(async(rows:Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">[])=>{ await bulkInsertTimeErrors(rows); },[]);
  const handleLogout  = async()=>{ 
    await supabase.auth.signOut(); 
    toast.success("Sesión cerrada correctamente");
    router.replace("/login"); 
  };

  const setF = (k:keyof FilterState,v:unknown)=>setFilters(f=>({...f,[k]:v}));
  const hasFilter = !!(filters.search||filters.estado||filters.sector||filters.motivo||filters.soloFaltantes);

  const SC = "width:100%;height:100%;background:transparent;border:none;outline:none;padding:0 10px;font-size:12px;color:var(--t1);font-family:'Inter',sans-serif;cursor:pointer;";

  const columns = useMemo<ColumnDef<TimeError,any>[]>(()=>[
    { id:"sel", enableSorting:false, size:36,
      header:()=><input type="checkbox" style={{accentColor:"var(--accent)",cursor:"pointer"}} checked={selected.size===data.length&&data.length>0} onChange={e=>e.target.checked?setSelected(new Set(data.map(r=>r.id))):setSelected(new Set())}/>,
      cell:({row})=><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><input type="checkbox" style={{accentColor:"var(--accent)",cursor:"pointer"}} checked={selected.has(row.original.id)} onChange={e=>setSelected(prev=>{const n=new Set(prev);e.target.checked?n.add(row.original.id):n.delete(row.original.id);return n;})}/></div>,
    },
    ch.accessor("fecha",{
      header:({column})=><SH col={column} label="Fecha"/>,
      cell:({row})=><EditableCell value={row.original.fecha} type="date" onChange={v=>upd(row.original.id,"fecha",v)}/>,
      size:116, sortingFn:"alphanumeric",
    }),
    { id:"dia", header:"Día", enableSorting:false, size:40,
      cell:({row})=><div style={{padding:"0 8px",textAlign:"center",fontSize:11,fontWeight:500,color:"var(--t3)",fontFamily:"'JetBrains Mono',monospace"}}>{diaES(row.original.fecha)}</div>,
    },
    ch.accessor("contrato",{
      header:({column})=><SH col={column} label="Contrato"/>,
      cell:({row})=><select value={row.original.contrato} onChange={e=>upd(row.original.id,"contrato",e.target.value)} style={{width:"100%",height:"100%",background:"transparent",border:"none",outline:"none",padding:"0 10px",fontSize:11,color:row.original.contrato?"var(--t1)":"var(--t3)",fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}}>
        <option value="">—</option>
        {CONTRATOS.map(c=><option key={c} value={c}>{c}</option>)}
      </select>,
      size:116,
    }),
    ch.accessor("empleado",{
      header:({column})=><SH col={column} label="Apellido y Nombre"/>,
      cell:({row})=><EditableCell value={row.original.empleado} type="name" placeholder="García, Juan" onChange={v=>upd(row.original.id,"empleado",v)}/>,
      size:185,
    }),
    ch.accessor("motivo",{
      header:({column})=><SH col={column} label="Motivo"/>,
      cell:({row})=><select value={row.original.motivo} onChange={e=>upd(row.original.id,"motivo",e.target.value)} style={{width:"100%",height:"100%",background:"transparent",border:"none",outline:"none",padding:"0 10px",fontSize:12,color:row.original.motivo?"var(--t1)":"var(--t3)",cursor:"pointer"}}>
        <option value="">— Seleccionar —</option>
        {MOTIVOS.map(m=><option key={m} value={m}>{m}</option>)}
      </select>,
      size:198,
    }),
    ch.accessor("sector",{
      header:({column})=><SH col={column} label="Área / Sector"/>,
      cell:({row})=><SectorCell value={row.original.sector} onChange={v=>upd(row.original.id,"sector",v)}/>,
      size:145,
    }),
    ch.accessor("ot",{
      header:({column})=><SH col={column} label="OT"/>,
      cell:({row})=><EditableCell value={row.original.ot} type="ot" placeholder="0000" onChange={v=>upd(row.original.id,"ot",v)}/>,
      size:100,
    }),
    ch.accessor("ot_em",{ header:"OT Em.", enableSorting:false, size:82,
      cell:({row})=><EditableCell value={row.original.ot_em} type="ot" onChange={v=>upd(row.original.id,"ot_em",v)}/>,
    }),
    ch.accessor("ot_em2",{ header:"OT Em.2", enableSorting:false, size:82,
      cell:({row})=><EditableCell value={row.original.ot_em2} type="ot" onChange={v=>upd(row.original.id,"ot_em2",v)}/>,
    }),
    ch.accessor("hh_normales",{
      header:({column})=><SH col={column} label="HH Nor."/>,
      cell:({row})=><EditableCell value={row.original.hh_normales} type="hora" placeholder="00:00" align="center" onChange={v=>upd(row.original.id,"hh_normales",v)}/>,
      size:72,
    }),
    ch.accessor("hh_50",{
      header:({column})=><SH col={column} label="HH 50%"/>,
      cell:({row})=><EditableCell value={row.original.hh_50} type="hora" placeholder="00:00" align="center" onChange={v=>upd(row.original.id,"hh_50",v)}/>,
      size:72,
    }),
    ch.accessor("hh_100",{
      header:({column})=><SH col={column} label="HH 100%"/>,
      cell:({row})=><EditableCell value={row.original.hh_100} type="hora" placeholder="00:00" align="center" onChange={v=>upd(row.original.id,"hh_100",v)}/>,
      size:76,
    }),
    { id:"complements", header:"Complementos", enableSorting:false, size:158,
      cell:({row})=><ComplementEditor row={row.original} onSave={vals=>{ upd(row.original.id,"insa",vals.insa); upd(row.original.id,"polu",vals.polu); upd(row.original.id,"noct",vals.noct); }}/>,
    },
    ch.accessor("estado",{
      header:({column})=><SH col={column} label="Estado"/>,
      cell:({row})=><div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",padding:"0 8px"}}><StatusBadge value={row.original.estado as Estado} onChange={v=>upd(row.original.id,"estado",v)}/></div>,
      size:128,
    }),
    ch.accessor("observaciones",{ header:"Observaciones", enableSorting:false, size:170,
      cell:({row})=><EditableCell value={row.original.observaciones} placeholder="Notas…" onChange={v=>upd(row.original.id,"observaciones",v)}/>,
    }),
    { id:"actions", header:"", enableSorting:false, size:60,
      cell:({row})=>(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,height:"100%",padding:"0 4px"}}>
          <button onClick={()=>setHistRow(row.original)} title="Historial" style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:5,background:"transparent",border:"none",cursor:"pointer",color:"var(--t3)"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button onClick={()=>handleDup(row.original)} title="Duplicar" style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:5,background:"transparent",border:"none",cursor:"pointer",color:"var(--t3)"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      ),
    },
  ],[data,selected,upd,handleDup]);

  const table = useReactTable({
    data, columns, getCoreRowModel:getCoreRowModel(),
    getFilteredRowModel:getFilteredRowModel(), getSortedRowModel:getSortedRowModel(),
    globalFilterFn:gff, state:{globalFilter:filters,sorting}, onSortingChange:setSorting,
    onGlobalFilterChange:()=>{},
  });

  const rows = table.getRowModel().rows;

  const stats = useMemo(()=>{
    const parseHH=(s:string)=>{ if(!s||s==="00:00") return 0; const[h,m]=s.split(":").map(Number); return h*60+(m||0); };
    const sumMin=(f:keyof TimeError)=>rows.reduce((a,r)=>a+parseHH(String(r.original[f]??"")),0);
    const fmt=(m:number)=>m>0?`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`:"—";
    return {
      total:rows.length, pendiente:rows.filter(r=>r.original.estado==="Pendiente").length,
      revision:rows.filter(r=>r.original.estado==="En revisión").length,
      corregido:rows.filter(r=>r.original.estado==="Corregido").length,
      faltantes:rows.filter(r=>FALTANTES.has(r.original.motivo)).length,
      norTotal:fmt(sumMin("hh_normales")), e50Total:fmt(sumMin("hh_50")), e100Total:fmt(sumMin("hh_100")),
    };
  },[rows]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--bg)"}}>
      {/* HEADER */}
      <Header onLogout={handleLogout}/>

      {/* CONTROLS */}
      <div style={{background:"var(--bg-card)",borderBottom:"1px solid var(--border-hi)",flexShrink:0}}>
        {/* Row 1 - Actions */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:6,background:"rgba(5,150,105,0.08)",border:"1px solid rgba(5,150,105,0.2)"}}>
              <div className="dot-live"/>
              {!isMobile&&<span style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--green)",fontFamily:"'JetBrains Mono',monospace"}}>EN VIVO</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {!isMobile&&<ImportExcel onImport={handleImport} currentFecha={filters.fecha} onReset={load}/>}
            {!isMobile&&rows.length>0&&<ExportExcel data={rows.map(r=>r.original)} fecha={filters.fecha}/>}
            <button className="btn btn-primary" onClick={()=>setAddModal(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {isMobile?"Nuevo":"Nuevo registro"}
            </button>
            {selected.size>0&&<button className="btn btn-danger" onClick={handleDelSel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              {`Eliminar (${selected.size})`}
            </button>}
          </div>
        </div>

        {/* Accent line */}
        <div style={{height:1,background:"linear-gradient(90deg,transparent,var(--accent),var(--accent-hover),transparent)",opacity:0.4}}/>

        {/* Row 2 — filters */}
        <div style={{padding:"10px 20px",display:"flex",flexWrap:"wrap",alignItems:"center",gap:10}}>
          <div style={{position:"relative",display:"flex",alignItems:"center"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:"absolute",left:9,color:"var(--t3)",pointerEvents:"none"}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="fi" style={{paddingLeft:28,width:160}} placeholder="Buscar empleado…" value={filters.search} onChange={e=>setF("search",e.target.value)}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <input type="date" className="fi" value={filters.fecha} onChange={e=>setF("fecha",e.target.value)}/>
            {filters.fecha&&<button onClick={()=>setF("fecha","")} className="btn btn-ghost" style={{padding:"0 8px",height:30,fontSize:11}}>✕</button>}
          </div>
          <SelectDropdown 
            value={filters.estado}
            onChange={e=>setF("estado",e)}
            options={[
              {label:"Todos los estados",value:""},
              {label:"Pendiente",value:"Pendiente"},
              {label:"En revisión",value:"En revisión"},
              {label:"Corregido",value:"Corregido"}
            ]}
            style={{width:140}}
          />
          {!isMobile&&<>
            <SelectDropdown
              value={filters.motivo}
              onChange={e=>setF("motivo",e)}
              options={[{label:"Todos los motivos",value:""}, ...MOTIVOS.map(m=>({label:m,value:m}))]}
              style={{width:170}}
            />
            <input className="fi" style={{width:120}} placeholder="Sector…" value={filters.sector} onChange={e=>setF("sector",e.target.value)}/>
          </>}
          <button onClick={()=>setF("soloFaltantes",!filters.soloFaltantes)}
            style={{height:30,padding:"0 12px",borderRadius:7,fontSize:11,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5,border:`1px solid ${filters.soloFaltantes?"rgba(251,191,36,0.4)":"var(--border-hi)"}`,background:filters.soloFaltantes?"rgba(251,191,36,0.12)":"transparent",color:filters.soloFaltantes?"var(--amber)":"var(--t3)",transition:"all 0.15s"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Faltantes{filters.soloFaltantes?" ✓":""}
          </button>
          {isMobile&&<ImportExcel onImport={handleImport} currentFecha={filters.fecha} onReset={load}/>}
          {hasFilter&&<button className="btn btn-ghost" style={{height:30,fontSize:11}} onClick={()=>setFilters(f=>({...f,estado:"",sector:"",motivo:"",search:"",soloFaltantes:false}))}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Limpiar
          </button>}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <span style={{fontSize:11,color:"var(--t3)",fontFamily:"'JetBrains Mono',monospace"}}>{stats.total} reg.</span>
            <div style={{width:1,height:12,background:"var(--border-hi)"}}/>
            <span className="badge badge-pending">{stats.pendiente}</span>
            <span className="badge badge-review">{stats.revision}</span>
            <span className="badge badge-done">{stats.corregido}</span>
            {stats.faltantes>0&&<span className="badge" style={{background:"rgba(251,191,36,0.1)",color:"var(--amber)",borderColor:"rgba(251,191,36,0.25)"}}>⚠ {stats.faltantes}</span>}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflow:"auto"}}>
        {loading ? (
          <div className="table-state table-state-loading">
            <div className="table-state-spinner" />
            <span>Cargando datos…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="table-state table-state-empty">
            <svg className="table-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            <p className="table-state-title">Sin registros</p>
            <p className="table-state-desc">{hasFilter ? "Probá limpiar los filtros" : "Agregá un registro o importá un Excel"}</p>
          </div>
        ) :isMobile?(
          <div style={{padding:12}}>
            {rows.map(row=><MobileCard key={row.id} row={row.original} onUpdate={upd} onDuplicate={handleDup} onDelete={handleDel} onHistory={setHistRow}/>)}
          </div>
        ):(
          <table className="tbl">
            <thead>
              {table.getHeaderGroups().map(hg=>(
                <tr key={hg.id}>
                  {hg.headers.map(h=><th key={h.id} style={{width:h.getSize()}}>{flexRender(h.column.columnDef.header,h.getContext())}</th>)}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row,i)=>(
                <tr key={row.id} className={`anim${selected.has(row.original.id)?" sel":""}`}
                  style={{animationDelay:`${Math.min(i*10,180)}ms`, borderLeft:FALTANTES.has(row.original.motivo)?"2px solid var(--amber)":"none"}}>
                  {row.getVisibleCells().map(cell=><td key={cell.id} style={{width:cell.column.getSize()}}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <Footer/>

      {addModal&&<AddRowModal onAdd={handleAdd} onClose={()=>setAddModal(false)}/>}
      {histRow&&<HistoryModal recordId={histRow.id} empleado={histRow.empleado} onClose={()=>setHistRow(null)}/>}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .table-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; gap: 14px; padding: 24px;
        }
        .table-state-loading span { font-size: 13px; color: var(--t3); }
        .table-state-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid var(--accent); border-top-color: transparent;
          animation: spin 0.8s linear infinite;
        }
        .table-state-empty { gap: 10px; }
        .table-state-icon { width: 52px; height: 52px; opacity: 0.12; color: var(--t1); }
        .table-state-title { font-size: 15px; font-weight: 600; color: var(--t2); }
        .table-state-desc { font-size: 13px; color: var(--t3); }
      `}</style>
    </div>
  );
}
