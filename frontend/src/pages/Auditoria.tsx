import { useCallback, useEffect, useMemo, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import { Icon } from "../components/Icon";
import { fechaHora } from "../types";

type Evento = {
  id: number;
  accion: string;
  entidad: string;
  entidadId: number | null;
  fecha: string;
  metadata: string | null;
  usuarioId: number | null;
};

export function AuditoriaPage({
  api,
  esAdmin,
}: {
  api: Api;
  esAdmin: boolean;
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      if (!esAdmin) return;
      setCargando(true);
      setError("");
      try {
        setEventos(await api<Evento[]>("/api/auditoria", { signal }));
      } catch (e) {
        if (!abortado(e)) setError(detalleError(e));
      } finally {
        if (!signal?.aborted) setCargando(false);
      }
    },
    [api, esAdmin],
  );

  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLocaleLowerCase("es-AR");
    if (!q) return eventos;
    return eventos.filter((e) =>
      `${e.accion} ${e.entidad} ${e.entidadId ?? ""} ${e.metadata ?? ""} ${e.usuarioId ?? ""}`
        .toLocaleLowerCase("es-AR")
        .includes(q),
    );
  }, [eventos, filtro]);

  if (!esAdmin)
    return (
      <section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">CONTROL DEL SISTEMA</p>
            <h1>Auditoría</h1>
          </div>
        </div>
        <div className="alert error" role="alert">
          El historial de auditoría está disponible únicamente para usuarios con
          rol ADMIN.
        </div>
      </section>
    );

  return (
    <section aria-labelledby="audit-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTROL DEL SISTEMA</p>
          <h1 id="audit-title">Auditoría</h1>
          <p className="muted">Últimos eventos registrados por el sistema.</p>
        </div>
        <button
          className="secondary small"
          disabled={cargando}
          onClick={() => void cargar()}
        >
          <Icon name="refresh" size={15} />
          Actualizar
        </button>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button className="secondary small" onClick={() => void cargar()}>
            Reintentar
          </button>
        </div>
      )}
      <div className="audit-toolbar card">
        <label htmlFor="audit-search">
          Filtrar por acción, entidad, identificador o detalle
        </label>
        <input
          id="audit-search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Ej. CREAR_PLANTILLA, Paciente…"
        />
      </div>
      <div className="audit-heading">
        <h2>Actividad reciente</h2>
        <span className="muted">
          {cargando
            ? "Cargando…"
            : `${filtrados.length} de ${eventos.length} eventos`}
        </span>
      </div>
      {cargando ? (
        <div className="card loading" role="status">
          Cargando auditoría…
        </div>
      ) : filtrados.length ? (
        <div className="card audit-list">
          {filtrados.map((evento) => (
            <article className="audit-entry" key={evento.id}>
              <span className="audit-mark">
                <Icon name="audit" size={17} />
              </span>
              <div className="audit-event">
                <div className="audit-event-heading">
                  <strong>{evento.accion.replaceAll("_", " ")}</strong>
                  <time dateTime={evento.fecha}>
                    {fechaHora(evento.fecha)}
                  </time>
                </div>
                <p>
                  <span>
                    {evento.entidad}
                    {evento.entidadId != null ? ` #${evento.entidadId}` : ""}
                  </span>
                  {evento.usuarioId != null && (
                    <span>Usuario #{evento.usuarioId}</span>
                  )}
                </p>
                {evento.metadata && <small>{evento.metadata}</small>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="audit" size={30} />
          <h3>{filtro ? "Sin resultados" : "Todavía no hay eventos"}</h3>
          <p>
            {filtro
              ? "Probá con otro término de búsqueda."
              : "Las acciones administrativas aparecerán aquí cuando se registren."}
          </p>
        </div>
      )}
    </section>
  );
}
