import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { NuevoPaciente, ObraSocial } from "../types";

type CampoTexto = "dni" | "nombre" | "apellido" | "telefono" | "email";
type Props = {
  api: Api;
  value: NuevoPaciente;
  busy: boolean;
  submitLabel: string;
  error?: string;
  intro?: string;
  onChange: (campo: keyof NuevoPaciente, value: string | number | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};
const campos: { id: CampoTexto; etiqueta: string; tipo: string; maxLength: number; requerido?: boolean }[] = [
  { id: "dni", etiqueta: "DNI", tipo: "text", maxLength: 20, requerido: true },
  { id: "nombre", etiqueta: "Nombre", tipo: "text", maxLength: 100, requerido: true },
  { id: "apellido", etiqueta: "Apellido", tipo: "text", maxLength: 100, requerido: true },
  { id: "telefono", etiqueta: "Teléfono", tipo: "tel", maxLength: 50 },
  { id: "email", etiqueta: "Email", tipo: "email", maxLength: 150 },
];

export function PacienteForm({ api, value, busy, submitLabel, error, intro, onChange, onSubmit, onCancel }: Props) {
  const [obras, setObras] = useState<ObraSocial[]>([]);
  const [cargandoObras, setCargandoObras] = useState(true);
  const [nuevaObra, setNuevaObra] = useState(false);
  const [nombreObra, setNombreObra] = useState("");
  const [guardandoObra, setGuardandoObra] = useState(false);
  const [errorObra, setErrorObra] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api<ObraSocial[]>("/api/obras-sociales", { signal: controller.signal })
      .then(setObras)
      .catch((e) => { if (!abortado(e)) setErrorObra(detalleError(e)); })
      .finally(() => { if (!controller.signal.aborted) setCargandoObras(false); });
    return () => controller.abort();
  }, [api]);

  async function agregarObraSocial() {
    if (!nombreObra.trim() || guardandoObra) return;
    setGuardandoObra(true);
    setErrorObra("");
    try {
      const creada = await api<ObraSocial>("/api/obras-sociales", {
        method: "POST", body: JSON.stringify({ nombre: nombreObra.trim() }),
      });
      setObras((prev) => [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      onChange("obraSocialId", creada.id);
      setNuevaObra(false);
      setNombreObra("");
    } catch (e) { setErrorObra(detalleError(e)); }
    finally { setGuardandoObra(false); }
  }

  return (
    <form className="stack" onSubmit={(e) => { if (!nuevaObra) onSubmit(e); else e.preventDefault(); }}>
      {intro && <p className="muted">{intro}</p>}
      <fieldset disabled={busy || guardandoObra}>
        <div className="form-grid">
          {campos.map((campo) => (
            <label key={campo.id}>
              {campo.etiqueta}
              <input type={campo.tipo} required={campo.requerido} maxLength={campo.maxLength}
                value={value[campo.id]} onChange={(e) => onChange(campo.id, e.target.value)} />
            </label>
          ))}
          <label>
            Obra social <span className="optional">(opcional)</span>
            <select aria-label="Obra social" value={nuevaObra ? "nueva" : value.obraSocialId ?? ""}
              disabled={cargandoObras} onChange={(e) => {
                setErrorObra("");
                if (e.target.value === "nueva") { setNuevaObra(true); onChange("obraSocialId", null); }
                else { setNuevaObra(false); onChange("obraSocialId", e.target.value ? Number(e.target.value) : null); }
              }}>
              <option value="">Sin obra social / particular</option>
              {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
              <option value="nueva">+ Agregar nueva obra social...</option>
            </select>
          </label>
        </div>
        {nuevaObra && (
          <div className="stack">
            <label>Nombre de la nueva obra social
              <input maxLength={120} value={nombreObra} onChange={(e) => setNombreObra(e.target.value)}
                placeholder="Nombre de la obra social" />
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={() => { setNuevaObra(false); setNombreObra(""); setErrorObra(""); }}>Volver</button>
              <button type="button" className="secondary" disabled={!nombreObra.trim() || guardandoObra}
                onClick={() => void agregarObraSocial()}>
                {guardandoObra ? "Agregando..." : "Agregar obra social"}
              </button>
            </div>
          </div>
        )}
        {errorObra && <p className="alert error" role="alert">{errorObra}</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        <div className="dialog-actions">
          {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>}
          <button type="submit" className={`primary ${onCancel ? "" : "full"}`} disabled={nuevaObra || cargandoObras || !!errorObra}>
            {submitLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
