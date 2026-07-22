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

type Tab = "todos" | "pendientes" | "contactados";

function waLink(telefono: string, nombre: string) {
  const digits = telefono.replace(/\D/g, "");
  const mensaje = `Hola ${nombre}, vi que tu negocio no tiene página web. Te puedo ayudar a crear una, ¿te interesa conversar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
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
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filtrar por rubro"
          value={filtroRubro}
          onChange={(e) => setFiltroRubro(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          placeholder="Filtrar por comuna"
          value={filtroComuna}
          onChange={(e) => setFiltroComuna(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => exportarCsv(leadsVisibles)}
          disabled={leadsVisibles.length === 0}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
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
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                tab === value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-medium text-amber-700">
            {pendientesCount} pendientes por contactar
          </span>
          {" · "}
          <span className="font-medium text-green-700">
            {contactadosCount} ya contactados
          </span>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2 pr-3">Ya le hablé</th>
                <th className="py-2 pr-3">Nombre</th>
                <th className="py-2 pr-3">Rubro</th>
                <th className="py-2 pr-3">Comuna</th>
                <th className="py-2 pr-3">Teléfono</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {leadsVisibles.map((lead) => {
                const yaHablado = lead.estado !== "nuevo";
                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-100 ${
                      lead.estado === "nuevo" ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="py-2 pr-3 text-center">
                      <input
                        type="checkbox"
                        checked={yaHablado}
                        onChange={(e) => toggleYaHable(lead.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-2 pr-3">{lead.nombre}</td>
                    <td className="py-2 pr-3">{lead.rubro}</td>
                    <td className="py-2 pr-3">{lead.comuna ?? "-"}</td>
                    <td className="py-2 pr-3">{lead.telefono}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={lead.estado}
                        onChange={(e) => cambiarEstado(lead.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <a
                        href={waLink(lead.telefono, lead.nombre)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Hablar por WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
              {leadsVisibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    Sin leads en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
