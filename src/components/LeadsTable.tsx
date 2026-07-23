"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface Lead {
  id: string;
  osmId: string;
  nombre: string;
  rubro: string;
  direccion: string;
  comuna: string | null;
  telefono: string;
  email: string | null;
  rating: number | null;
  tieneWebsite: boolean;
  estado: string;
  fechaCreacion: string;
}

const ESTADOS = ["nuevo", "contactado", "respondio", "cliente"] as const;

const ESTADO_ESTILOS: Record<string, { badge: string; dot: string }> = {
  nuevo: { badge: "bg-amber-soft text-amber border-amber/20", dot: "bg-amber" },
  contactado: { badge: "bg-blue-soft text-blue border-blue/20", dot: "bg-blue" },
  respondio: { badge: "bg-violet-soft text-violet border-violet/20", dot: "bg-violet" },
  cliente: { badge: "bg-emerald-soft text-emerald border-emerald/20", dot: "bg-emerald" },
};

type Tab = "todos" | "pendientes" | "contactados";

function waLink(telefono: string, nombre: string) {
  const digits = telefono.replace(/\D/g, "");
  const mensaje = `Hola ${nombre}, vi que tu negocio no tiene página web. Te puedo ayudar a crear una, ¿te interesa conversar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5.1-1.3A10 10 0 1012 2zm0 1.8a8.2 8.2 0 016.9 12.6l-.2.4.7 2.5-2.6-.7-.4.2A8.2 8.2 0 1112 3.8z" />
      <path d="M9.1 7.4c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3 1.9 3 4.7 4.1c2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4s-1.7-.9-2-1c-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.5-.9-2z" />
    </svg>
  );
}

function EstadoBadge({
  estado,
  onChange,
}: {
  estado: string;
  onChange: (estado: string) => void;
}) {
  const estilo = ESTADO_ESTILOS[estado] ?? ESTADO_ESTILOS.nuevo;
  const indiceActual = ESTADOS.indexOf(estado as (typeof ESTADOS)[number]);

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="relative inline-flex">
        <select
          value={estado}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none rounded-full border px-3 py-1 pr-6 text-xs font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${estilo.badge}`}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e} className="text-ink">
              {e}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2"
          fill="none"
        >
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex gap-1 pl-1" title={`Etapa ${indiceActual + 1} de ${ESTADOS.length}`}>
        {ESTADOS.map((e, i) => (
          <span
            key={e}
            className={`h-1 w-3 rounded-full ${
              i <= indiceActual ? estilo.dot : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function exportarCsv(leads: Lead[]) {
  const columnas = ["nombre", "rubro", "direccion", "comuna", "telefono", "estado"];
  const filas = leads.map((l) =>
    [l.nombre, l.rubro, l.direccion, l.comuna ?? "", l.telefono, l.estado]
      .map(csvEscape)
      .join(",")
  );
  const csv = [columnas.join(","), ...filas].join("\n");

  const fecha = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${fecha}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface LeadsTableHandle {
  reload: () => void;
}

interface LeadsTableProps {
  reloadKey: number;
}

export function LeadsTable({ reloadKey }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroRubro, setFiltroRubro] = useState("");
  const [filtroComuna, setFiltroComuna] = useState("");
  const [tab, setTab] = useState<Tab>("todos");

  const cargarLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroRubro) params.set("rubro", filtroRubro);
    if (filtroComuna) params.set("comuna", filtroComuna);

    const res = await fetch(`/api/leads?${params.toString()}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [filtroRubro, filtroComuna]);

  useEffect(() => {
    cargarLeads();
  }, [cargarLeads, reloadKey]);

  async function cambiarEstado(id: string, estado: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
  }

  function toggleYaHable(id: string, yaHablado: boolean) {
    cambiarEstado(id, yaHablado ? "contactado" : "nuevo");
  }

  const pendientesCount = useMemo(
    () => leads.filter((l) => l.estado === "nuevo").length,
    [leads]
  );
  const contactadosCount = leads.length - pendientesCount;

  const leadsVisibles = useMemo(() => {
    const filtrados = leads.filter((l) => {
      if (tab === "pendientes") return l.estado === "nuevo";
      if (tab === "contactados") return l.estado !== "nuevo";
      return true;
    });

    return [...filtrados].sort((a, b) => {
      if (a.estado === "nuevo" && b.estado !== "nuevo") return -1;
      if (a.estado !== "nuevo" && b.estado === "nuevo") return 1;
      return (
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
      );
    });
  }, [leads, tab]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Filtrar por rubro"
            value={filtroRubro}
            onChange={(e) => setFiltroRubro(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="Filtrar por comuna"
            value={filtroComuna}
            onChange={(e) => setFiltroComuna(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => exportarCsv(leadsVisibles)}
          disabled={leadsVisibles.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-primary/50 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path
              d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 15v1a2 2 0 002 2h8a2 2 0 002-2v-1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-surface p-1">
          {(
            [
              ["todos", "Todos"],
              ["pendientes", "Pendientes"],
              ["contactados", "Contactados"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:bg-surface-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-sm text-muted">
          <span className="font-medium text-amber">{pendientesCount} pendientes</span>
          <span className="mx-2 text-border">·</span>
          <span className="font-medium text-emerald">{contactadosCount} contactados</span>
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface py-16">
            <svg
              className="h-6 w-6 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-sm text-muted">Cargando leads…</p>
          </div>
        ) : leadsVisibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted/60" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M20 20l-4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <p className="font-display text-base font-medium text-ink">
              Sin leads en esta vista
            </p>
            <p className="max-w-xs text-sm text-muted">
              Ajusta los filtros o corre una nueva búsqueda arriba para encontrar negocios.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla — pantallas medianas en adelante */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Ya le hablé
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Rubro
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Comuna
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                      WhatsApp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leadsVisibles.map((lead, i) => {
                    const yaHablado = lead.estado !== "nuevo";
                    return (
                      <tr
                        key={lead.id}
                        className={`border-b border-border/70 last:border-0 transition-colors hover:bg-surface-muted ${
                          i % 2 === 1 ? "bg-surface-muted/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={yaHablado}
                            onChange={(e) => toggleYaHable(lead.id, e.target.checked)}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">{lead.nombre}</td>
                        <td className="px-4 py-3 text-muted">{lead.rubro}</td>
                        <td className="px-4 py-3 text-muted">{lead.comuna ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-ink">{lead.telefono}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge
                            estado={lead.estado}
                            onChange={(estado) => cambiarEstado(lead.id, estado)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={waLink(lead.telefono, lead.nombre)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-hover"
                          >
                            <WhatsAppIcon />
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <ul className="flex flex-col gap-3 md:hidden">
              {leadsVisibles.map((lead) => {
                const yaHablado = lead.estado !== "nuevo";
                return (
                  <li
                    key={lead.id}
                    className="rounded-xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display font-medium text-ink">{lead.nombre}</p>
                        <p className="text-sm text-muted">
                          {lead.rubro} · {lead.comuna ?? "—"}
                        </p>
                      </div>
                      <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          checked={yaHablado}
                          onChange={(e) => toggleYaHable(lead.id, e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Ya le hablé
                      </label>
                    </div>

                    <p className="mt-2 font-mono text-sm text-ink">{lead.telefono}</p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <EstadoBadge
                        estado={lead.estado}
                        onChange={(estado) => cambiarEstado(lead.id, estado)}
                      />
                      <a
                        href={waLink(lead.telefono, lead.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-hover"
                      >
                        <WhatsAppIcon />
                        WhatsApp
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
