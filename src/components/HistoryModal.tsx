"use client";
import { useEffect, useState } from "react";
import { fetchHistory } from "@/lib/supabase";
type H = Awaited<ReturnType<typeof fetchHistory>>[0];
const LABELS: Record<string,string> = {
  fecha:"Fecha",contrato:"Contrato",empleado:"Empleado",motivo:"Motivo",sector:"Sector",
  ot:"OT",ot_em:"OT Em.",ot_em2:"OT Em.2",hh_normales:"HH Normales",hh_50:"HH 50%",
  hh_100:"HH 100%",estado:"Estado",observaciones:"Observaciones",insa:"INSA",polu:"POLU",noct:"NOCT",
};
const fmt = (iso:string) => new Date(iso).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});

export default function HistoryModal({ recordId, empleado, onClose }: { recordId:string; empleado:string; onClose:()=>void }) {
  const [rows,setRows] = useState<H[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{ fetchHistory(recordId).then(h=>{ setRows(h); setLoading(false); }); },[recordId]);
  return (
    <div className="overlay">
      <div className="modal anim" style={{maxWidth:580}}>
        <div className="modal-head">
          <div>
            <p style={{fontWeight:600,fontSize:13,color:"var(--t1)"}}>Historial de cambios</p>
            <p style={{fontSize:10,color:"var(--t3)",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>{empleado}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{padding:"0 8px"}}>✕</button>
        </div>
        <div style={{maxHeight:380,overflowY:"auto"}}>
          {loading
            ? <div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid var(--accent)",borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/></div>
            : rows.length===0
            ? <div style={{textAlign:"center",padding:40,color:"var(--t3)",fontSize:12}}>Sin cambios registrados</div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"var(--bg-row)"}}>
                    {["Fecha","Campo","Antes","Después"].map(h=>(
                      <th key={h} style={{padding:"6px 14px",textAlign:"left",fontSize:9,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--t3)",borderBottom:"1px solid var(--border)"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h,i)=>(
                    <tr key={h.id} style={{background:i%2===0?"var(--bg-card)":"var(--bg-row)"}}>
                      <td style={{padding:"6px 14px",color:"var(--t3)",whiteSpace:"nowrap",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(h.created_at)}</td>
                      <td style={{padding:"6px 14px",fontWeight:500,color:"var(--t2)"}}>{LABELS[h.campo]||h.campo}</td>
                      <td style={{padding:"6px 14px",color:"#f87171",textDecoration:"line-through",opacity:0.7}}>{h.valor_anterior||"—"}</td>
                      <td style={{padding:"6px 14px",color:"#4ade80"}}>{h.valor_nuevo||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
        <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}
