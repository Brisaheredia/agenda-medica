import { useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Franja, NuevoPaciente, Paciente } from "../types";
import { fechaLarga, hora, reservable } from "../types";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { PacienteForm } from "./PacienteForm";
const vacio: NuevoPaciente = {
  dni: "",
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
};
export function BookingPanel({
  api,
  franjas,
  selected,
  select,
  busy,
  ready,
  profesionalId,
  irAFranja,
  reservar,
  gestionarPacientes,
}: {
  api: Api;
  franjas: Franja[];
  selected: Franja | null;
  select: (f: Franja | null) => void;
  busy: boolean;
  ready: boolean;
  profesionalId?: number;
  irAFranja: (franja: Franja) => void;
  reservar: (paciente: Paciente, motivo: string) => Promise<boolean>;
  gestionarPacientes: boolean;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [motivo, setMotivo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  const [crear, setCrear] = useState(false);
  const [nuevo, setNuevo] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [buscandoProxima, setBuscandoProxima] = useState(false);
  const [proximaFranja, setProximaFranja] = useState<Franja | null>(null);
  const searching = useRef<AbortController | null>(null);
  const creating = useRef(false);
  useEffect(() => () => searching.current?.abort(), []);
  async function buscar() {
    if (!gestionarPacientes && query.trim().length < 3) {
      setError("Ingresá al menos tres caracteres del apellido, teléfono o email, o el DNI completo.");
      return;
    }
    searching.current?.abort();
    const controller = new AbortController();
    searching.current = controller;
    setBuscando(true);
    setError("");
    setBuscado(false);
    try {
      const data = await api<Paciente[]>(
        `/api/pacientes${gestionarPacientes ? "" : "/seleccion"}?query=${encodeURIComponent(query.trim())}`,
        { signal: controller.signal },
      );
      setResultados(data.filter((p) => p.activo));
      setBuscado(true);
    } catch (e) {
      if (!abortado(e)) setError(detalleError(e));
    } finally {
      if (!controller.signal.aborted) setBuscando(false);
    }
  }
  async function guardarPaciente(e: React.FormEvent) {
    e.preventDefault();
    if (!gestionarPacientes || creating.current) return;
    creating.current = true;
    setGuardando(true);
    setError("");
    try {
      const p = await api<Paciente>("/api/pacientes", {
        method: "POST",
        body: JSON.stringify(nuevo),
      });
      searching.current?.abort();
      setBuscando(false);
      setPaciente(p);
      setQuery(`${p.apellido}, ${p.nombre}`);
      setResultados([]);
      setBuscado(false);
      setNuevo(vacio);
      setCrear(false);
    } catch (e) {
      setError(detalleError(e));
    } finally {
      creating.current = false;
      setGuardando(false);
    }
  }
  const disponibles = franjas.filter(reservable);
  async function buscarProxima() {
    if (!profesionalId || buscandoProxima) return;
    setBuscandoProxima(true);
    setError("");
    setProximaFranja(null);
    try {
      const horarios = await api<Franja[]>(
        `/api/agenda/disponibles?profesionalId=${profesionalId}`,
      );
      const primera = horarios.find(reservable);
      if (primera) setProximaFranja(primera);
      else
        setError(
          "No hay horarios futuros disponibles. Consultá con el médico o Administración para habilitar más horarios.",
        );
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setBuscandoProxima(false);
    }
  }
  return (
    <section className="booking card" aria-labelledby="booking-title">
      <header className="panel-heading">
        <div>
          <h2 id="booking-title">Asignar turno</h2>
          <p className="muted">Elegí un horario y un paciente.</p>
        </div>
        <a
          className="secondary small booking-availability-link"
          href="/disponibilidad"
        >
          <Icon name="calendar" size={15} />
          Horarios
        </a>
      </header>
      {selected ? (
        <div className="slot-summary">
          <Icon name="clock" size={26} />
          <div>
            <strong>
              {hora(selected.inicio)} – {hora(selected.fin)} hs
            </strong>
            <span>Horario seleccionado</span>
          </div>
        </div>
      ) : (
        <div className="slot-placeholder">
          <Icon name="clock" />
          <span>
            {ready
              ? disponibles.length
                ? "Elegí una franja libre en la agenda o en el selector."
                : "Todavía no hay franjas libres para esta fecha."
              : "Esperando los horarios de la agenda…"}
          </span>
        </div>
      )}
      <fieldset disabled={busy || guardando}>
        <div className="next-slot-search">
          <button
            type="button"
            className="secondary small"
            disabled={!profesionalId || buscandoProxima || busy}
            onClick={() => void buscarProxima()}
          >
            {buscandoProxima ? "Buscando…" : "Buscar próximo horario libre"}
          </button>
          {proximaFranja && (
            <button
              type="button"
              className="next-slot-result"
              onClick={() => {
                irAFranja(proximaFranja);
                setProximaFranja(null);
              }}
            >
              {fechaLarga(proximaFranja.inicio.slice(0, 10))},{" "}
              {hora(proximaFranja.inicio)} hs · Seleccionar
            </button>
          )}
        </div>
        <label>
          Horario disponible
          <select
            aria-label="Horario disponible"
            value={selected?.id ?? ""}
            disabled={!disponibles.length}
            onChange={(e) =>
              select(
                disponibles.find((f) => f.id === Number(e.target.value)) ??
                  null,
              )
            }
          >
            <option value="">
              {disponibles.length
                ? "Seleccionar horario…"
                : ready
                  ? "No hay horarios libres para esta fecha"
                  : "Cargando horarios…"}
            </option>
            {disponibles.map((f) => (
              <option key={f.id} value={f.id}>
                {hora(f.inicio)} – {hora(f.fin)}
              </option>
            ))}
          </select>
        </label>
        {ready && disponibles.length === 0 && (
          <div className="booking-empty-state" role="status">
            <p>
              {franjas.length === 0
                ? "La agenda de esta fecha no tiene franjas generadas. Consultá con el médico o Administración para habilitarlas."
                : "Las franjas de esta fecha están ocupadas, bloqueadas o ya pasaron. Probá otra fecha en la agenda."}
            </p>
            {franjas.length === 0 && (
              <a className="text-button" href="/disponibilidad">
                Ir a Disponibilidad
              </a>
            )}
          </div>
        )}
        <div className="field-heading">
          <label htmlFor="patient-search">Paciente</label>
          {gestionarPacientes && <button
            className="text-button"
            onClick={() => {
              setCrear(true);
              setError("");
            }}
          >
            <Icon name="plus" size={14} />
            Nuevo paciente
          </button>}
        </div>
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <input
            id="patient-search"
            placeholder="Buscar por DNI, apellido, teléfono o email"
            value={query}
            onChange={(e) => {
              searching.current?.abort();
              setBuscando(false);
              setQuery(e.target.value);
              setResultados([]);
              setBuscado(false);
              setPaciente(null);
            }}
          />
          <button
            className="secondary icon-button"
            aria-label="Buscar paciente"
            disabled={buscando}
          >
            <Icon name="search" />
          </button>
        </form>
        {buscando && (
          <p className="muted" role="status">
            Buscando pacientes…
          </p>
        )}
        {buscado && !resultados.length && (
          <p className="muted" role="status">
            No se encontraron pacientes activos.
          </p>
        )}
        {!!resultados.length && (
          <div className="patient-results">
            {resultados.map((p) => (
              <button
                key={p.id}
                className={`patient-result ${paciente?.id === p.id ? "selected" : ""}`}
                aria-pressed={paciente?.id === p.id}
                onClick={() => setPaciente(p)}
              >
                <span className="avatar">
                  {p.nombre.slice(0, 1)}
                  {p.apellido.slice(0, 1)}
                </span>
                <span>
                  <strong>
                    {p.apellido}, {p.nombre}
                  </strong>
                  <small>
                    DNI {p.dni}
                    {p.telefono ? ` · ${p.telefono}` : ""}
                  </small>
                </span>
                {paciente?.id === p.id && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        )}
        {paciente && !resultados.length && (
          <div className="selected-patient">
            <strong>
              {paciente.apellido}, {paciente.nombre}
            </strong>
            <span>DNI {paciente.dni}</span>
          </div>
        )}
        {gestionarPacientes && <label>
          Motivo de consulta <span className="optional">(opcional)</span>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Breve motivo del turno"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>}
        {error && !crear && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        <p className="booking-note">El turno quedará reservado al confirmar.</p>
        <button
          className="primary full"
          disabled={!ready || !paciente || !selected || !reservable(selected)}
          onClick={async () => {
            if (paciente && (await reservar(paciente, motivo))) {
              setPaciente(null);
              setResultados([]);
              setQuery("");
              setMotivo("");
              setBuscado(false);
            }
          }}
        >
          <Icon name="check" />
          {busy ? "Guardando…" : "Confirmar turno"}
        </button>
        {selected && (
          <button className="text-button full" onClick={() => select(null)}>
            Quitar selección
          </button>
        )}
      </fieldset>
      {gestionarPacientes && crear && (
        <Modal
          title="Nuevo paciente"
          busy={guardando}
          close={() => setCrear(false)}
        >
          <PacienteForm
            value={nuevo}
            busy={guardando}
            intro="Al guardar, quedar? seleccionado para este turno."
            error={error}
            submitLabel={guardando ? "Guardando?" : "Guardar y seleccionar"}
            onChange={(campo, value) => setNuevo({ ...nuevo, [campo]: value })}
            onSubmit={guardarPaciente}
          />
        </Modal>
      )}
    </section>
  );
}
