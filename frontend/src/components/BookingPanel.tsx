import { useEffect, useRef, useState } from 'react'
import type { Api } from '../api'
import { abortado, detalleError } from '../api'
import type { Franja, NuevoPaciente, Paciente } from '../types'
import { hora, reservable } from '../types'
import { Icon } from './Icon'
import { Modal } from './Modal'
const vacio: NuevoPaciente = { dni: '', nombre: '', apellido: '', telefono: '', email: '' }
export function BookingPanel({ api, franjas, selected, select, busy, ready, reservar }: {
  api: Api; franjas: Franja[]; selected: Franja | null; select: (f: Franja | null) => void; busy: boolean; ready: boolean;
  reservar: (paciente: Paciente, motivo: string) => Promise<boolean>;
}) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Paciente[]>([])
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [motivo, setMotivo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [error, setError] = useState('')
  const [crear, setCrear] = useState(false)
  const [nuevo, setNuevo] = useState(vacio)
  const [guardando, setGuardando] = useState(false)
  const searching = useRef<AbortController | null>(null)
  const creating = useRef(false)
  useEffect(() => () => searching.current?.abort(), [])
  async function buscar() {
    searching.current?.abort()
    const controller = new AbortController()
    searching.current = controller
    setBuscando(true); setError(''); setBuscado(false)
    try {
      const data = await api<Paciente[]>(`/api/pacientes?query=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
      setResultados(data.filter(p => p.activo)); setBuscado(true)
    } catch (e) { if (!abortado(e)) setError(detalleError(e)) }
    finally { if (!controller.signal.aborted) setBuscando(false) }
  }
  async function guardarPaciente(e: React.FormEvent) {
    e.preventDefault()
    if (creating.current) return
    creating.current = true; setGuardando(true); setError('')
    try {
      const p = await api<Paciente>('/api/pacientes', { method: 'POST', body: JSON.stringify(nuevo) })
      searching.current?.abort(); setBuscando(false)
      setPaciente(p); setQuery(`${p.apellido}, ${p.nombre}`); setResultados([]); setBuscado(false); setNuevo(vacio); setCrear(false)
    } catch (e) { setError(detalleError(e)) }
    finally { creating.current = false; setGuardando(false) }
  }
  const disponibles = franjas.filter(reservable)
  return <section className="booking card" aria-labelledby="booking-title">
    <header className="panel-heading"><div><h2 id="booking-title">Asignar turno</h2><p className="muted">Elegí un horario y un paciente.</p></div><Icon name="calendar"/></header>
    {selected ? <div className="slot-summary"><Icon name="clock" size={26}/><div><strong>{hora(selected.inicio)} – {hora(selected.fin)} hs</strong><span>Horario seleccionado</span></div></div> : <div className="slot-placeholder"><Icon name="clock"/><span>Seleccioná una franja libre en la agenda.</span></div>}
    <fieldset disabled={busy || guardando || !ready}>
      <label>Horario disponible<select aria-label="Horario disponible" value={selected?.id ?? ''} onChange={e => select(disponibles.find(f => f.id === Number(e.target.value)) ?? null)}><option value="">Seleccionar horario…</option>{disponibles.map(f => <option key={f.id} value={f.id}>{hora(f.inicio)} – {hora(f.fin)}</option>)}</select></label>
      <div className="field-heading"><label htmlFor="patient-search">Paciente</label><button className="text-button" onClick={() => { setCrear(true); setError('') }}><Icon name="plus" size={14}/>Nuevo paciente</button></div>
      <form className="search-row" onSubmit={e => { e.preventDefault(); buscar() }}><input id="patient-search" placeholder="Buscar por DNI o apellido" value={query} onChange={e => { searching.current?.abort(); setBuscando(false); setQuery(e.target.value); setResultados([]); setBuscado(false); setPaciente(null) }}/><button className="secondary icon-button" aria-label="Buscar paciente" disabled={buscando}><Icon name="search"/></button></form>
      {buscando && <p className="muted" role="status">Buscando pacientes…</p>}
      {buscado && !resultados.length && <p className="muted" role="status">No se encontraron pacientes activos.</p>}
      {!!resultados.length && <div className="patient-results">{resultados.map(p => <button key={p.id} className={`patient-result ${paciente?.id === p.id ? 'selected' : ''}`} aria-pressed={paciente?.id === p.id} onClick={() => setPaciente(p)}><span className="avatar">{p.nombre.slice(0, 1)}{p.apellido.slice(0, 1)}</span><span><strong>{p.apellido}, {p.nombre}</strong><small>DNI {p.dni}{p.telefono ? ` · ${p.telefono}` : ''}</small></span>{paciente?.id === p.id && <Icon name="check" size={16}/>}</button>)}</div>}
      {paciente && !resultados.length && <div className="selected-patient"><strong>{paciente.apellido}, {paciente.nombre}</strong><span>DNI {paciente.dni}</span></div>}
      <label>Motivo de consulta <span className="optional">(opcional)</span><textarea rows={3} maxLength={500} placeholder="Breve motivo del turno" value={motivo} onChange={e => setMotivo(e.target.value)}/></label>
      {error && !crear && <p className="alert error" role="alert">{error}</p>}
      <p className="booking-note">El turno quedará reservado al confirmar.</p>
      <button className="primary full" disabled={!paciente || !selected || !reservable(selected)} onClick={async () => { if (paciente && await reservar(paciente, motivo)) { setPaciente(null); setResultados([]); setQuery(''); setMotivo(''); setBuscado(false) } }}><Icon name="check"/>{busy ? 'Guardando…' : 'Confirmar turno'}</button>
      {selected && <button className="text-button full" onClick={() => select(null)}>Quitar selección</button>}
    </fieldset>
    {crear && <Modal title="Nuevo paciente" busy={guardando} close={() => setCrear(false)}><form onSubmit={guardarPaciente} className="stack"><p className="muted">Al guardar, quedará seleccionado para este turno.</p><fieldset disabled={guardando}><div className="form-grid">{(['dni', 'nombre', 'apellido', 'telefono', 'email'] as const).map(campo => <label key={campo}>{({ dni: 'DNI', nombre: 'Nombre', apellido: 'Apellido', telefono: 'Teléfono', email: 'Email' })[campo]}<input type={campo === 'email' ? 'email' : campo === 'telefono' ? 'tel' : 'text'} required={['dni', 'nombre', 'apellido'].includes(campo)} maxLength={campo === 'dni' ? 20 : campo === 'telefono' ? 50 : campo === 'email' ? 150 : 100} value={nuevo[campo]} onChange={e => setNuevo({ ...nuevo, [campo]: e.target.value })}/></label>)}</div>{error && <p className="alert error" role="alert">{error}</p>}<button className="primary full">{guardando ? 'Guardando…' : 'Guardar y seleccionar'}</button></fieldset></form></Modal>}
  </section>
}
