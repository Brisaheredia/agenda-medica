import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, abortado, crearApi, detalleError } from './api'
import { crearDemoApi } from './demo'
import type { Filtro, Franja, Paciente, Profesional, Sesion, Turno } from './types'
import { activo, fechaLarga, hoy, moverDia, reservable } from './types'
import { Icon } from './components/Icon'
import { Brand } from './components/Brand'
import { Agenda } from './components/Agenda'
import { BookingPanel } from './components/BookingPanel'
import { TurnoDialog } from './components/TurnoDialog'
import type { Accion } from './components/TurnoDialog'
import './styles.css'

export default function App() {
  const [demo, setDemo] = useState(() => new URLSearchParams(window.location.search).get('demo') === '1')
  const [version, setVersion] = useState(0)
  function cambiarModo(value: boolean) {
    const url = new URL(window.location.href)
    if (value) url.searchParams.set('demo', '1')
    else url.searchParams.delete('demo')
    window.history.replaceState(null, '', url)
    setDemo(value)
  }
  return <AgendaApp key={`${demo}-${version}`} demo={demo} cambiarModo={cambiarModo} reiniciarDemo={() => setVersion(n => n + 1)}/>
}

function AgendaApp({ demo, cambiarModo, reiniciarDemo }: { demo: boolean; cambiarModo: (value: boolean) => void; reiniciarDemo: () => void }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    if (demo) return { token: 'demo-in-memory', email: 'Datos de ejemplo', rol: 'ADMIN' }
    try { const s = JSON.parse(localStorage.getItem('agendaSesion') ?? 'null'); return s?.token && s?.email && ['ADMIN', 'RECEPCION', 'MEDICO'].includes(s?.rol) ? s : null } catch { return null }
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)
  const [profesional, setProfesional] = useState<Profesional | null>(null)
  const [fecha, setFecha] = useState(() => demo ? moverDia(hoy(), 1) : hoy())
  const [franjas, setFranjas] = useState<Franja[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [revision, setRevision] = useState(0)
  const [intentoProfesional, setIntentoProfesional] = useState(0)
  const [loadedKey, setLoadedKey] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorAgenda, setErrorAgenda] = useState('')
  const [selected, setSelected] = useState<Franja | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('TODOS')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<{ turno: Turno; tipo: Accion } | null>(null)
  const mutation = useRef(false)
  const salir = useCallback(() => {
    if (demo) { cambiarModo(false); return }
    localStorage.removeItem('agendaSesion'); setSesion(null); setProfesional(null); setFranjas([]); setTurnos([]); setSelected(null); setDialog(null); setLoadedKey(''); setMensaje(null)
  }, [demo, cambiarModo])
  const api = useMemo(() => demo ? crearDemoApi() : crearApi(sesion, salir), [demo, sesion, salir])
  const key = `${profesional?.id}/${fecha}/${revision}`
  const ready = loadedKey === key && !cargando && !errorAgenda
  const gestionar = sesion?.rol === 'ADMIN' || sesion?.rol === 'RECEPCION'
  const cerrar = sesion?.rol === 'ADMIN' || sesion?.rol === 'MEDICO'

  useEffect(() => {
    if (!sesion) return
    const controller = new AbortController()
    api<Profesional[]>('/api/profesionales', { signal: controller.signal }).then(data => {
      const p = data.find(p => p.activo)
      if (!p) throw new Error('No hay un profesional activo configurado para la agenda.')
      setProfesional(p)
    }).catch(e => { if (!abortado(e)) setErrorAgenda(detalleError(e)) })
    return () => controller.abort()
  }, [api, sesion, intentoProfesional])

  useEffect(() => {
    if (!sesion || !profesional) return
    const controller = new AbortController()
    setCargando(true); setErrorAgenda(''); setSelected(null)
    const query = `profesionalId=${profesional.id}&fecha=${fecha}`
    Promise.all([api<Franja[]>(`/api/agenda?${query}`, { signal: controller.signal }), api<Turno[]>(`/api/turnos?${query}`, { signal: controller.signal })])
      .then(([f, t]) => { setFranjas(f); setTurnos(t); setLoadedKey(key) })
      .catch(e => { if (!abortado(e)) { setErrorAgenda(detalleError(e)); setFranjas([]); setTurnos([]) } })
      .finally(() => { if (!controller.signal.aborted) setCargando(false) })
    return () => controller.abort()
  }, [api, sesion, profesional, fecha, key])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    if (loginBusy) return
    setLoginBusy(true); setMensaje(null); setErrorAgenda('')
    try {
      const data = await api<Sesion>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) })
      localStorage.setItem('agendaSesion', JSON.stringify(data)); setSesion(data); setPassword('')
    } catch (e) { setMensaje({ tipo: 'error', texto: detalleError(e) }) }
    finally { setLoginBusy(false) }
  }

  async function guardar(path: string, body?: object): Promise<boolean> {
    if (mutation.current || !ready) return false
    mutation.current = true; setBusy(true); setMensaje(null)
    try {
      await api(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) })
      setMensaje({ tipo: 'success', texto: path === '/api/turnos' ? 'Turno reservado correctamente.' : 'El cambio se guardó correctamente.' })
      setRevision(n => n + 1); setSelected(null)
      return true
    } catch (e) {
      const conflicto = e instanceof ApiError && e.status === 409
      setMensaje({ tipo: 'error', texto: conflicto ? `No se guardó el cambio: ${detalleError(e)}. La agenda se actualizará para que puedas elegir otro horario.` : detalleError(e) })
      if (conflicto) { setRevision(n => n + 1); setSelected(null) }
      return false
    } finally { mutation.current = false; setBusy(false) }
  }
  function cambiarFecha(value: string) { if (value && !busy) { setFecha(value); setSelected(null); setFiltro('TODOS'); setMensaje(null) } }

  if (!sesion) return <main className="login-shell"><section className="login-card card"><Brand/><p className="eyebrow">CONSULTORIO DR. SALVADOR AMADO</p><h1>Tu agenda, en orden.</h1><p className="muted">Ingresá para gestionar pacientes y turnos.</p><form className="stack" onSubmit={login}><fieldset disabled={loginBusy}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="primary full">{loginBusy ? 'Ingresando…' : 'Ingresar'}</button></fieldset></form>{mensaje && <p className={`alert ${mensaje.tipo}`} role="alert">{mensaje.texto}</p>}<div className="demo-entry"><button type="button" className="secondary full" disabled={loginBusy} onClick={() => cambiarModo(true)}><Icon name="calendar" size={17}/>Probar con datos de ejemplo</button><p>Sin cuenta y sin encender el backend.</p></div><p className="login-footer">Agenda Médica · Gestión del consultorio</p></section></main>

  const menu = [{ icon: 'calendar', label: 'Agenda', active: true }, { icon: 'people', label: 'Pacientes' }, { icon: 'clock', label: 'Disponibilidad' }, { icon: 'block', label: 'Bloqueos y excepciones' }, { icon: 'audit', label: 'Auditoría' }]
  const filters: { id: Filtro; label: string }[] = [{ id: 'TODOS', label: 'Todos' }, { id: 'LIBRE', label: 'Disponibles' }, { id: 'RESERVADO', label: 'Reservados' }, { id: 'ATENDIDO', label: 'Atendidos' }, { id: 'AUSENTE', label: 'Ausentes' }, { id: 'BLOQUEADA', label: 'Bloqueados' }, { id: 'CANCELADO', label: 'Cancelados' }]
  return <div className="app-shell"><a href="#main" className="skip-link">Ir a la agenda</a><aside className="sidebar"><div className="sidebar-brand"><Brand/><div><strong>Agenda Médica</strong><span>Gestión del consultorio</span></div></div><p className="nav-label">OPERACIÓN PRINCIPAL</p><nav aria-label="Navegación principal">{menu.map(item => <button key={item.label} className={`nav-item ${item.active ? 'active' : ''}`} aria-current={item.active ? 'page' : undefined} disabled={!item.active}><Icon name={item.icon}/><span>{item.label}</span>{!item.active && <small>Pendiente</small>}</button>)}</nav><div className="sidebar-foot"><Icon name="audit"/><p>Un espacio para organizar<br/>la atención de cada día.</p></div></aside>
    <div className="workspace"><header className="topbar"><div className="consultorio"><span className="eyebrow">CONSULTORIO</span><strong>{profesional ? `Dr. ${profesional.nombre} ${profesional.apellido}` : 'Dr. Salvador Amado'}</strong></div><div className="session"><span className="avatar">{sesion.email.slice(0, 1).toUpperCase()}</span><div><strong>{sesion.email}</strong><span>{{ ADMIN: 'Administración', RECEPCION: 'Recepción', MEDICO: 'Médico' }[sesion.rol]}</span></div><button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión" disabled={busy} onClick={salir}><Icon name="exit"/></button></div></header>
      <main id="main" className="content">
        {demo && <section className="demo-banner" aria-label="Modo de demostración">
          <div><strong>Modo de demostración</strong><p>Pacientes y turnos ficticios. Los cambios duran hasta recargar o reiniciar. Empezamos con horarios de mañana.</p></div>
          <div className="demo-actions"><button className="secondary small" disabled={busy} onClick={reiniciarDemo}><Icon name="refresh" size={15}/>Reiniciar ejemplos</button><button className="text-button" disabled={busy} onClick={() => cambiarModo(false)}>Salir de la demostración</button></div>
        </section>}
        {demo && <details className="demo-guide"><summary>Ideas para probar esta versión</summary><ol><li>Elegí un horario disponible, buscá <strong>Luna</strong> y confirmá un turno para Bruno.</li><li>Reprogramá el turno de <strong>Clara Ríos</strong> eligiendo otra fecha y horario.</li><li>Cancelá una reserva indicando un motivo y consultá el filtro <strong>Cancelados</strong>.</li><li>Creá un paciente desde <strong>Nuevo paciente</strong> y asignale un horario.</li><li>Para registrar atención o ausencia, elegí una fecha pasada y probá con el turno reservado de las 11:00.</li></ol></details>}
        <div className="page-heading"><div><p className="eyebrow">ORGANIZACIÓN DIARIA</p><h1>Agenda del consultorio</h1><p className="muted">Todos los horarios del día, en un solo lugar.</p></div><div className="page-heading-actions">{!demo && <button className="secondary small" disabled={busy} onClick={() => cambiarModo(true)}>Probar ejemplos</button>}<span className="page-label"><Icon name="calendar" size={16}/>Vista diaria</span></div></div>
        {mensaje && <div className={`alert ${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}><span>{mensaje.texto}</span><button className="icon-button" aria-label="Cerrar mensaje" onClick={() => setMensaje(null)}><Icon name="close" size={16}/></button></div>}
        <section className="date-toolbar card" aria-label="Navegación por fecha"><div className="date-controls"><button className="icon-button" aria-label="Día anterior" disabled={busy} onClick={() => cambiarFecha(moverDia(fecha, -1))}><Icon name="left"/></button><button className="secondary" disabled={busy} onClick={() => cambiarFecha(hoy())}>Hoy</button><button className="icon-button" aria-label="Día siguiente" disabled={busy} onClick={() => cambiarFecha(moverDia(fecha, 1))}><Icon name="right"/></button></div><div className="date-title"><Icon name="calendar"/><strong>{fechaLarga(fecha)}</strong></div><input type="date" aria-label="Fecha de la agenda" value={fecha} disabled={busy} onChange={e => cambiarFecha(e.target.value)}/><button className="secondary" disabled={busy || cargando || !profesional} onClick={() => setRevision(n => n + 1)}><Icon name="refresh" size={16}/>Actualizar</button></section>
        {errorAgenda && <div className="alert error" role="alert"><span>{errorAgenda}</span><button className="secondary" onClick={() => { setErrorAgenda(''); if (profesional) setRevision(n => n + 1); else setIntentoProfesional(n => n + 1) }}>Reintentar</button></div>}
        <section className="metrics" aria-label="Resumen de la agenda" aria-busy={!ready}>{[{ label: 'Franjas del día', value: franjas.length, caption: 'Horarios de atención', icon: 'calendar' }, { label: 'Disponibles', value: franjas.filter(reservable).length, caption: 'Horarios que podés reservar', icon: 'clock' }, { label: 'Turnos reservados', value: turnos.filter(activo).length, caption: 'Reservados y confirmados', icon: 'people' }].map(m => <article className="metric card" key={m.label}><div><span>{m.label}</span><strong>{ready ? m.value : '—'}</strong><p>{m.caption}</p></div><span className="metric-icon"><Icon name={m.icon} size={25}/></span></article>)}</section>
        <div className={`agenda-layout ${!gestionar ? 'read-only' : ''}`}><section aria-labelledby="agenda-title"><div className="agenda-heading"><h2 id="agenda-title">Horarios y turnos</h2><span className="muted">{ready ? `${franjas.length} franjas` : 'Cargando agenda…'}</span></div><div className="filters" role="group" aria-label="Filtrar agenda por estado">{filters.map(f => <button key={f.id} aria-pressed={filtro === f.id} className={filtro === f.id ? 'filter active' : 'filter'} onClick={() => setFiltro(f.id)}>{f.label}</button>)}</div>
          {!ready && !errorAgenda && <div className="card loading" role="status">Cargando horarios y turnos…</div>}
          {ready && <Agenda franjas={franjas} turnos={turnos} filtro={filtro} selected={selected?.id} gestionar={gestionar} cerrar={cerrar} busy={busy} select={setSelected} action={(turno, tipo) => setDialog({ turno, tipo })}/>}
        </section>{gestionar && <BookingPanel api={api} franjas={ready ? franjas : []} selected={selected} select={setSelected} busy={busy} ready={ready} reservar={(paciente: Paciente, motivo: string) => selected ? guardar('/api/turnos', { pacienteId: paciente.id, franjaId: selected.id, motivoConsulta: motivo.trim() }) : Promise.resolve(false)}/>}</div>
      </main>
    </div>{dialog && <TurnoDialog turno={dialog.turno} tipo={dialog.tipo} api={api} busy={busy} close={() => setDialog(null)} submit={guardar}/>}</div>
}
