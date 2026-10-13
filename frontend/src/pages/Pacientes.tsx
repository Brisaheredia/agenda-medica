import { useCallback, useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { NuevoPaciente, Paciente } from "../types";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";

const vacio: NuevoPaciente = {
  dni: "",
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
};

export function PacientesPage({
  api,
  puedeGestionar,
}: {
  api: Api;
  puedeGestionar: boolean;
}) {
  const [query, setQuery] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mutando, setMutando] = useState(false);
  const [modal, setModal] = useState(false);
  const [edicion, setEdicion] = useState<Paciente | null>(null);
  const [form, setForm] = useState<NuevoPaciente>(vacio);
  const [desactivar, setDesactivar] = useState<Paciente | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const searchRef = useRef<AbortController | null>(null);

  const cargar = useCallback(
    async (texto = query) => {
      searchRef.current?.abort();
      const controller = new AbortController();
      searchRef.current = controller;
      setCargando(true);
      setError("");
      try {
        const data = await api<Paciente[]>(
          `/api/pacientes?query=${encodeURIComponent(texto.trim())}`,
          { signal: controller.signal },
        );
        setPacientes(data);
      } catch (e) {
        if (!abortado(e)) setError(detalleError(e));
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    },
    [api, query],
  );

  useEffect(() => {
    void cargar("");
    return () => searchRef.current?.abort();
  }, [cargar]);

  function abrirNuevo() {
    setEdicion(null);
    setForm(vacio);
    setError("");
    setModal(true);
  }

  function abrirEdicion(paciente: Paciente) {
    setEdicion(paciente);
    setForm({
      dni: paciente.dni,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      telefono: paciente.telefono ?? "",
      email: paciente.email ?? "",
    });
    setError("");
    setModal(true);
  }

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutando) return;
    setMutando(true);
    setError("");
    setMensaje("");
    try {
      await api<Paciente>(
        edicion ? `/api/pacientes/${edicion.id}` : "/api/pacientes",
        {
          method: edicion ? "PUT" : "POST",
          body: JSON.stringify(form),
        },
      );
      setModal(false);
      setMensaje(edicion ? "Paciente actualizado." : "Paciente creado.");
      await cargar();
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setMutando(false);
    }
  }

  async function confirmarDesactivacion() {
    if (!desactivar || mutando) return;
    setMutando(true);
    setError("");
    setMensaje("");
    try {
      await api<void>(`/api/pacientes/${desactivar.id}`, { method: "DELETE" });
      setMensaje(
        `Se desactivó a ${desactivar.apellido}, ${desactivar.nombre}.`,
      );
      setDesactivar(null);
      await cargar();
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setMutando(false);
    }
  }

  return (
    <section aria-labelledby="patients-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN DE PACIENTES</p>
          <h1 id="patients-title">Pacientes</h1>
          <p className="muted">
            Buscá y mantené actualizados los datos de tus pacientes.
          </p>
        </div>
        {puedeGestionar && (
          <button className="primary small" onClick={abrirNuevo}>
            <Icon name="plus" size={16} />
            Nuevo paciente
          </button>
        )}
      </div>

      {error && !modal && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert success" role="status">
          {mensaje}
        </div>
      )}

      <form
        className="patient-toolbar card"
        onSubmit={(e) => {
          e.preventDefault();
          void cargar(query);
        }}
      >
        <label htmlFor="patients-search">Buscar por DNI o apellido</label>
        <div className="search-row">
          <input
            id="patients-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ingresá un DNI o apellido"
          />
          <button className="secondary" disabled={cargando}>
            <Icon name="search" size={17} />
            Buscar
          </button>
          <button
            type="button"
            className="text-button"
            disabled={cargando}
            onClick={() => {
              setQuery("");
              void cargar("");
            }}
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="patients-heading">
        <h2>Listado</h2>
        <span className="muted">
          {cargando ? "Cargando…" : `${pacientes.length} pacientes`}
        </span>
      </div>
      {cargando ? (
        <div className="card loading" role="status">
          Cargando pacientes…
        </div>
      ) : pacientes.length ? (
        <div className="card patients-table-wrap">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Contacto</th>
                {puedeGestionar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>
                      {p.apellido}, {p.nombre}
                    </strong>
                  </td>
                  <td>{p.dni}</td>
                  <td>
                    {p.telefono || p.email ? (
                      <>
                        {p.telefono && <span>{p.telefono}</span>}
                        {p.telefono && p.email && <br />}
                        {p.email && <span>{p.email}</span>}
                      </>
                    ) : (
                      <span className="muted">Sin datos de contacto</span>
                    )}
                  </td>
                  {puedeGestionar && (
                    <td className="patient-actions">
                      <button
                        className="text-button"
                        onClick={() => abrirEdicion(p)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-button danger-text"
                        onClick={() => setDesactivar(p)}
                      >
                        Desactivar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="people" size={30} />
          <h3>No encontramos pacientes</h3>
          <p>
            Probá con otro DNI o apellido.
            {puedeGestionar
              ? " También podés registrar un paciente nuevo."
              : ""}
          </p>
        </div>
      )}

      {modal && (
        <Modal
          title={edicion ? "Editar paciente" : "Nuevo paciente"}
          busy={mutando}
          close={() => setModal(false)}
        >
          <form className="stack" onSubmit={guardar}>
            <fieldset disabled={mutando}>
              <div className="form-grid">
                {(
                  ["dni", "nombre", "apellido", "telefono", "email"] as const
                ).map((campo) => (
                  <label key={campo}>
                    {
                      {
                        dni: "DNI",
                        nombre: "Nombre",
                        apellido: "Apellido",
                        telefono: "Teléfono",
                        email: "Email",
                      }[campo]
                    }
                    <input
                      type={
                        campo === "email"
                          ? "email"
                          : campo === "telefono"
                            ? "tel"
                            : "text"
                      }
                      required={["dni", "nombre", "apellido"].includes(campo)}
                      maxLength={
                        campo === "dni"
                          ? 20
                          : campo === "telefono"
                            ? 50
                            : campo === "email"
                              ? 150
                              : 100
                      }
                      value={form[campo]}
                      onChange={(e) =>
                        setForm({ ...form, [campo]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              {error && (
                <p className="alert error" role="alert">
                  {error}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setModal(false)}
                >
                  Cancelar
                </button>
                <button className="primary">
                  {mutando ? "Guardando…" : "Guardar paciente"}
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}

      {desactivar && (
        <Modal
          title="Desactivar paciente"
          busy={mutando}
          close={() => setDesactivar(null)}
        >
          <p>
            ¿Querés desactivar a{" "}
            <strong>
              {desactivar.apellido}, {desactivar.nombre}
            </strong>
            ? Dejará de aparecer en las búsquedas y no se eliminará su historial
            de turnos.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              disabled={mutando}
              onClick={() => setDesactivar(null)}
            >
              Cancelar
            </button>
            <button
              className="danger"
              disabled={mutando}
              onClick={() => void confirmarDesactivacion()}
            >
              {mutando ? "Desactivando…" : "Desactivar paciente"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
