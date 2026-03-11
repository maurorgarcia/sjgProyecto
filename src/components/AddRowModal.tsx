"use client";
import { useState, useCallback } from "react";
import type { TimeError } from "@/types";
import { SelectDropdown } from "./SelectDropdown";

const CONTRATOS = ["6700248017","6700302926"];
const MOTIVOS   = ["Par de fichada incompleto","Omisión","Saldo Insuficiente","OT inexistente","Falta parte","Falta cargar"];
const SECTORES  = ["Mecánica","Eléctrica","Instrumentos","Civil","Aislación","Pintura","Andamios","Pañol/Logística","Coordinación","Puesto Fijo","RRHH","Administración"];
const COMPS     = ["","INSA","POLU","NOCT"];

const BLANK = {
  fecha: new Date().toISOString().slice(0,10), contrato:"", empleado:"", motivo:"", sector:"",
  ot:"", ot_em:"", ot_em2:"", grupo_id: null as string | null,
  hh_normales:"00:00", hh_50:"00:00", hh_100:"00:00",
  estado:"Pendiente" as const, observaciones:"", insa:"00:00", polu:"00:00", noct:"00:00",
};

export default function AddRowModal({ onAdd, onClose }: { onAdd:(r:Omit<TimeError,"id"|"created_at"|"updated_at"|"dia">)=>Promise<void>; onClose:()=>void }) {
  const [form,setForm]   = useState({...BLANK});
  const [saving,setSaving] = useState(false);
  const [errors,setErrors] = useState<Record<string,string>>({});
  const [cNor,setCNor]   = useState(""); const [c50,setC50] = useState(""); const [c100,setC100] = useState("");

  const filterVal = (field:string,raw:string)=>{
    if(field==="empleado") return raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s,.\-']/g,"");
    if(["ot","ot_em","ot_em2"].includes(field)) return raw.replace(/[^0-9A-Za-z\-]/g,"").slice(0,20);
    if(["hh_normales","hh_50","hh_100","insa","polu","noct"].includes(field)){
      const d=raw.replace(/[^0-9]/g,"").slice(0,4); return d.length<=2?d:d.slice(0,2)+":"+d.slice(2);
    }
    return raw;
  };

  const set = useCallback((field:keyof typeof BLANK)=>(value:string|React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>{
    const val = typeof value === "string" ? value : value.target.value;
    const filtered = filterVal(field as string, val);
    setForm(f=>({...f,[field]:filtered}));
    if(field==="empleado"&&/[0-9]/.test(filtered)) setErrors(p=>({...p,empleado:"Solo letras"}));
    else setErrors(p=>({...p,[field as string]:""}));
  },[]);

  const submit = async () => {
    const errs: Record<string,string> = {};
    if(!form.empleado.trim()) errs.empleado="Requerido";
    else if(/[0-9]/.test(form.empleado)) errs.empleado="Solo letras";
    if(!form.fecha) errs.fecha="Requerido";
    setErrors(errs);
    if(Object.values(errs).some(Boolean)) return;
    setSaving(true);
    const applyComp = (hora:string,comp:string,field:"insa"|"polu"|"noct",obj:Record<string,string>)=>{
      if(comp&&hora!=="00:00") obj[field]=hora;
    };
    const extra: Record<string,string> = {};
    applyComp(form.hh_normales,cNor,cNor.toLowerCase() as "insa"|"polu"|"noct",extra);
    applyComp(form.hh_50,c50,c50.toLowerCase() as "insa"|"polu"|"noct",extra);
    applyComp(form.hh_100,c100,c100.toLowerCase() as "insa"|"polu"|"noct",extra);
    await onAdd({...form,...extra});
    setSaving(false);
    onClose();
  };

  const Row = ({label,children}:{label:string;children:React.ReactNode})=>(
    <div>
      <label className="lbl">{label}</label>
      {children}
    </div>
  );

  const err = (f:string) => errors[f]?<p style={{fontSize:10,color:"var(--red)",marginTop:4}}>⚠ {errors[f]}</p>:null;

  const HoraRow = ({label,field,comp,setComp}:{label:string;field:keyof typeof BLANK;comp:string;setComp:(v:string)=>void})=>(
    <div style={{display:"flex",gap:6,alignItems:"flex-end",minWidth:0}}>
      <div style={{flex:1}}>
        <label className="lbl">{label}</label>
        <input value={form[field] as string} onChange={set(field)} className="form-input" placeholder="00:00"/>
      </div>
      <div style={{width:90}}>
        <label className="lbl">Comp.</label>
        <SelectDropdown
          value={comp}
          onChange={setComp}
          options={COMPS.map(c=>({label:c||"—",value:c}))}
          style={{height:"100%"}}
        />
      </div>
    </div>
  );

  return (
    <div className="overlay">
      <div className="modal anim">
        <div className="modal-head">
          <p style={{fontWeight:600,fontSize:14,color:"var(--t1)"}}>Nuevo registro</p>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:"0 8px"}}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Row label="Fecha">
              <input type="date" value={form.fecha} onChange={set("fecha")} className={`form-input${errors.fecha?" error":""}`}/>
              {err("fecha")}
            </Row>
            <Row label="Contrato">
              <SelectDropdown
                value={form.contrato}
                onChange={(v)=>set("contrato")(v)}
                options={[{label:"—",value:""}, ...CONTRATOS.map(c=>({label:c,value:c}))]}
              />
            </Row>
            <div style={{gridColumn:"1/-1"}}>
              <Row label="Apellido y Nombre">
                <input value={form.empleado} onChange={set("empleado")} className={`form-input${errors.empleado?" error":""}`} placeholder="García, Juan"/>
                {err("empleado")}
              </Row>
            </div>
            <Row label="Motivo">
              <SelectDropdown
                value={form.motivo}
                onChange={(v)=>set("motivo")(v)}
                options={[{label:"— Seleccionar —",value:""}, ...MOTIVOS.map(m=>({label:m,value:m}))]}
              />
            </Row>
            <Row label="Área / Sector">
              <SelectDropdown
                value={form.sector}
                onChange={(v)=>set("sector")(v)}
                options={[{label:"— Seleccionar —",value:""}, ...SECTORES.map(s=>({label:s,value:s}))]}
              />
            </Row>
            <Row label="OT"><input value={form.ot} onChange={set("ot")} className="form-input" placeholder="0000"/></Row>
            <Row label="OT Em."><input value={form.ot_em} onChange={set("ot_em")} className="form-input" placeholder="0000"/></Row>
          </div>
          <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <HoraRow label="HH Normales" field="hh_normales" comp={cNor} setComp={setCNor}/>
            <HoraRow label="HH E.50%" field="hh_50" comp={c50} setComp={setC50}/>
            <HoraRow label="HH E.100%" field="hh_100" comp={c100} setComp={setC100}/>
          </div>
          <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Row label="Estado">
              <SelectDropdown
                value={form.estado}
                onChange={(v)=>set("estado")(v)}
                options={[
                  {label:"Pendiente",value:"Pendiente"},
                  {label:"En revisión",value:"En revisión"},
                  {label:"Corregido",value:"Corregido"}
                ]}
              />
            </Row>
            <div style={{gridColumn:"1/-1"}}>
              <Row label="Observaciones">
                <textarea value={form.observaciones} onChange={set("observaciones")} className="form-input" rows={2} style={{height:"auto",paddingTop:8,resize:"none"}} placeholder="Notas adicionales…"/>
              </Row>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving?<><span style={{width:12,height:12,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",animation:"spin 0.8s linear infinite",display:"inline-block"}}/> Guardando…</>:"Guardar registro"}
          </button>
        </div>
      </div>
    </div>
  );
}
