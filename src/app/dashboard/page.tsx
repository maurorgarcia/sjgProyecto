"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, fetchTimeErrors } from "@/lib/supabase";
import type { TimeError } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<TimeError[]>([]);
  const [loading, setLoading] = useState(true);
   const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setData(await fetchTimeErrors());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const metrics = useMemo(() => {
    const MOTIVOS_FALTA = new Set<string>([
      "Omisión",
      "Par de fichada incompleto",
      "OT inexistente",
      "Saldo Insuficiente",
    ]);

    const byDay: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const bySector: Record<string, number> = {};

    data.forEach((r) => {
      // Contamos como "falta" los motivos definidos arriba
      if (!MOTIVOS_FALTA.has(r.motivo)) return;
      byDay[r.fecha] = (byDay[r.fecha] ?? 0) + 1;
      const ym = r.fecha.slice(0, 7);
      byMonth[ym] = (byMonth[ym] ?? 0) + 1;
      const sector = r.sector || "Sin sector";
      bySector[sector] = (bySector[sector] ?? 0) + 1;
    });

    const daysAll = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
    const sectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]);

    const lastMonthKey = months.length ? months[months.length - 1][0] : "";
    const currentMonthKey =
      selectedMonth && byMonth[selectedMonth] !== undefined ? selectedMonth : lastMonthKey;
    const currentMonthTotal = currentMonthKey ? byMonth[currentMonthKey] ?? 0 : 0;

    const days =
      currentMonthKey === ""
        ? daysAll
        : daysAll.filter(([fecha]) => fecha.slice(0, 7) === currentMonthKey);

    const maxDay = days.reduce((m, [, c]) => (c > m ? c : m), 0);
    const maxSector = sectors.reduce((m, [, c]) => (c > m ? c : m), 0);

    const totalFaltas = daysAll.reduce((acc, [, c]) => acc + c, 0);

    return {
      days,
      months,
      sectors,
      currentMonthKey,
      currentMonthTotal,
      maxDay,
      maxSector,
      totalFaltas,
      totalDiasConFaltas: daysAll.length,
      lastMonthKey,
    };
  }, [data, selectedMonth]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)" }}>
      <Header onLogout={handleLogout} />

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "18px 22px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>
            Dashboard de asistencias
          </h1>
          <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 20 }}>
            Resumen de registros con motivos{" "}
            <strong>Omisión, Par de fichada incompleto, OT inexistente, Saldo Insuficiente</strong>{" "}
            (faltas).
          </p>

          {metrics.months.length > 0 && (
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--t3)" }}>Mes a visualizar:</span>
              <select
                value={selectedMonth || metrics.currentMonthKey || metrics.lastMonthKey || ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  height: 30,
                  borderRadius: 6,
                  border: "1px solid var(--border-hi)",
                  background: "var(--bg-card)",
                  padding: "0 10px",
                  fontSize: 12,
                  color: "var(--t1)",
                }}
              >
                {metrics.months.map(([ym]) => (
                  <option key={ym} value={ym}>
                    {ym.slice(5, 7)}/{ym.slice(0, 4)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
              Cargando métricas…
            </div>
          ) : metrics.days.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
              No hay registros con motivos de falta configurados para mostrar.
            </div>
          ) : (
            <>
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 12,
                    border: "1px solid var(--border-hi)",
                    padding: 16,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--t3)",
                      marginBottom: 6,
                    }}
                  >
                    Faltas (mes actual)
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}>
                    {metrics.currentMonthTotal}
                  </p>
                  {metrics.currentMonthKey && (
                    <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>
                      Mes: {metrics.currentMonthKey}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 12,
                    border: "1px solid var(--border-hi)",
                    padding: 16,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--t3)",
                      marginBottom: 6,
                    }}
                  >
                    Faltas totales
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}>
                    {metrics.totalFaltas}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>
                    Días con al menos una falta: {metrics.totalDiasConFaltas}
                  </p>
                </div>
              </section>

              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(260px, 1.3fr) minmax(220px, 1fr)",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 12,
                    border: "1px solid var(--border-hi)",
                    padding: 16,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--t3)",
                      marginBottom: 8,
                    }}
                  >
                    Faltas por día
                  </p>
                  <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {metrics.days.map(([fecha, count]) => (
                      <div key={fecha} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--t3)", width: 80 }}>
                          {fecha.slice(8, 10)}/{fecha.slice(5, 7)}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 7,
                            borderRadius: 999,
                            background: "var(--bg-row)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(count / (metrics.maxDay || 1)) * 100}%`,
                              height: "100%",
                              background: "rgba(220,38,38,0.9)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--t2)", width: 20, textAlign: "right" }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 12,
                    border: "1px solid var(--border-hi)",
                    padding: 16,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--t3)",
                      marginBottom: 8,
                    }}
                  >
                    Faltas por sector
                  </p>
                  <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {metrics.sectors.map(([sector, count]) => (
                      <div key={sector} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--t3)",
                            width: 120,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                          title={sector}
                        >
                          {sector}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 7,
                            borderRadius: 999,
                            background: "var(--bg-row)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(count / (metrics.maxSector || 1)) * 100}%`,
                              height: "100%",
                              background: "rgba(59,130,246,0.9)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--t2)", width: 20, textAlign: "right" }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

