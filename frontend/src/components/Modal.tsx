import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function Modal({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close() }, [])
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); if (!busy) close() }}>
    <header className="panel-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Cerrar diálogo" disabled={busy} onClick={close}><Icon name="close"/></button></header>
    {children}
  </dialog>
}
