import { useCallback, useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Rol } from "../types";
import { nombresRol, roles } from "../permisos";
import { Modal } from "../components/Modal";

type Usuario = { id: number; email: string; rol: Rol; activo: boolean };
type Edicion = { usuario: Usuario; tipo: "rol" | "password" | "activo" };

export function UsuariosPage({ api, emailActual, salir }: { api: Api; emailActual: string; salir: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("RECEPCION");
  const [password, setPassword] = useState("");
  const guardando = useRef(false);

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true);
    try { setUsuarios(await api<Usuario[]>("/api/usuarios", { signal })); }
    catch (e) { if (!abortado(e)) setError(detalleError(e)); }
    finally { if (!signal?.aborted) setCargando(false); }
  }, [api]);
  useEffect(() => {
    const controller = new AbortController();
    void cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);

  function cerrar() { setNuevo(false); setEdicion(null); setPassword(""); setError(""); }
  function abrir(usuario: Usuario, tipo: Edicion["tipo"]) {
    setEdicion({ usuario, tipo }); setRol(usuario.rol); setPassword(""); setError(""); setMensaje("");
  }
  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (guardando.current) return;
    guardando.current = true;
    setBusy(true); setError(""); setMensaje("");
    try {
      if (nuevo) {
        await api("/api/usuarios", { method: "POST", body: JSON.stringify({ email: email.trim(), password, rol }) });
      } else if (edicion) {
        const { usuario, tipo } = edicion;
        const path = `/api/usuarios/${usuario.id}/${tipo === "activo" ? `activo?activo=${!usuario.activo}` : tipo}`;
        await api(path, {
          method: tipo === "activo" ? "PATCH" : "PUT",
          ...(tipo === "activo" ? {} : { body: JSON.stringify(tipo === "rol" ? { rol } : { password }) }),
        });
        if (usuario.email.toLowerCase() === emailActual.toLowerCase()
            && (tipo !== "rol" || rol !== usuario.rol)) { salir(); return; }
      }
      cerrar(); setEmail(""); setMensaje("El usuario se actualizó correctamente.");
      await cargar();
    } catch (e) { setError(detalleError(e)); }
    finally { guardando.current = false; setBusy(false); }
  }

  return <section aria-labelledby="users-title">
    <div className="page-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1 id="users-title">Usuarios y roles</h1><p className="muted">Gestioná las cuentas que acceden al consultorio.</p></div>
      <button className="primary" disabled={busy} onClick={() => { cerrar(); setEmail(""); setRol("RECEPCION"); setNuevo(true); }}>Nuevo usuario</button>
    </div>
    {error && !nuevo && !edicion && <div className="alert error" role="alert">{error}<button className="secondary small" onClick={() => { setError(""); void cargar(); }}>Reintentar</button></div>}
    {mensaje && <div className="alert success" role="status">{mensaje}</div>}
    {cargando ? <div className="card loading" role="status">Cargando usuarios…</div> : <div className="card users-list">
      {usuarios.map((usuario) => <article className="user-row" key={usuario.id}>
        <div><strong>{usuario.email}</strong><p className="muted">{nombresRol[usuario.rol]} · {usuario.activo ? "Activo" : "Inactivo"}</p></div>
        <div className="user-actions">
          <button className="secondary small" disabled={busy} onClick={() => abrir(usuario, "rol")}>Cambiar rol</button>
          <button className="secondary small" disabled={busy} onClick={() => abrir(usuario, "password")}>Restablecer contraseña</button>
          <button className="secondary small" disabled={busy} onClick={() => abrir(usuario, "activo")}>{usuario.activo ? "Desactivar" : "Activar"}</button>
        </div>
      </article>)}
      {!usuarios.length && <p>No hay usuarios registrados.</p>}
    </div>}
    {(nuevo || edicion) && <Modal title={nuevo ? "Nuevo usuario" : edicion?.tipo === "password" ? "Restablecer contraseña" : edicion?.tipo === "rol" ? "Cambiar rol" : "Cambiar acceso"} busy={busy} close={cerrar}>
      <form className="stack" onSubmit={guardar}><fieldset disabled={busy}>
        {edicion && <p><strong>{edicion.usuario.email}</strong></p>}
        {nuevo && <label>Email<input type="email" required maxLength={150} value={email} autoComplete="off" onChange={(e) => setEmail(e.target.value)} /></label>}
        {(nuevo || edicion?.tipo === "rol") && <label>Rol<select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>{roles.map((r) => <option key={r} value={r}>{nombresRol[r]}</option>)}</select></label>}
        {(nuevo || edicion?.tipo === "password") && <label>Contraseña nueva<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><span className="muted">Mínimo 8 caracteres, máximo 72 bytes UTF-8.</span></label>}
        {edicion?.tipo === "activo" && <p>{edicion.usuario.activo ? "Al desactivar la cuenta, dejará de poder ingresar." : "La cuenta volverá a poder ingresar con su contraseña actual."}</p>}
        {edicion && edicion.tipo !== "activo" && <p className="muted">Al cambiar el rol o la contraseña, esa persona deberá volver a ingresar. Si cambiás tu propia cuenta, se cerrará tu sesión.</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="secondary" onClick={cerrar}>Volver</button><button className="primary">{busy ? "Guardando…" : "Confirmar"}</button></div>
      </fieldset></form>
    </Modal>}
  </section>;
}
