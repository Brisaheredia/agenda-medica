# Frontend de Agenda Médica

Interfaz React para personal del consultorio. Código en `frontend/`, dentro del repositorio. Actualizado con colores y reprogramaciones, 17 de octubre de 2026.

## Ejecutar

Ejecutar los siguientes comandos desde la raíz del repositorio.

Requiere Node compatible con el lockfile: Vite 8.3.3 y plugin React 6.1.2 declaran `^20.19.0 || >=22.12.0`. En esta sesión se compiló con Node 24.16.0. Usar una versión compatible y el lockfile del proyecto.

```powershell
Set-Location frontend
npm ci
# Crear o ajustar .env.local antes de iniciar Vite:
# VITE_API_URL=http://localhost:8080
npm run dev
```

Abrir la URL informada por Vite; si 5173 está ocupado puede usar otro puerto. La API por defecto del código es `http://localhost:8080`. Si otro entorno cambia el puerto, ajustar `.env.local` a ese backend; no asumir un puerto particular de otra máquina. Reiniciar Vite al cambiar variables de entorno. Sólo `VITE_API_URL` es configuración del cliente: nunca colocar secretos JWT o credenciales de BD en variables `VITE_*`.

```powershell
npm run build
npm run preview
```

`build` ejecuta TypeScript y genera `dist/`; `preview` sirve ese resultado para revisión local. No hay scripts de lint ni de pruebas de frontend en el manifiesto actual.

## Rutas y responsabilidades

| Ruta | Pantalla | Función |
|---|---|---|
| `/` | Agenda | Día/semana, reserva y acciones de turno |
| `/pacientes` | Pacientes | Búsqueda, alta, edición y baja lógica |
| `/disponibilidad` | Disponibilidad | Configuración, días y generación por mes con duración fija de 40 |
| `/bloqueos` | Bloqueos y excepciones | Cierre, apertura y día no laborable manual |
| `/reprogramaciones` | Reprogramaciones | Pacientes afectados, contacto y cambio de horario manual |
| `/auditoria` | Auditoría | Últimos eventos; sólo ADMIN |

El login se muestra al no existir sesión, sin ruta `/login` independiente. La navegación usa History API mediante `usePathname`; el hosting debe devolver `index.html` al recargar rutas de la SPA.

`App.tsx` compone sesión/rutas y coordina acciones; `pages/` implementa pantallas; `components/` contiene calendarios, reserva y diálogos; `hooks/useAgenda.ts` carga agenda diaria; `api.ts` centraliza fetch, JWT y errores; `types.ts` contiene tipos y funciones de fecha; `styles.css` define estilos. No existe `src/demo.ts` en esta base.

## Reglas de interfaz importantes

- Sesión almacenada en `localStorage` bajo `agendaSesion`. El rol mostrado no reemplaza la autorización del backend.
- HTTP 401 cierra sesión; HTTP 403 muestra falta de permisos. El backend todavía puede devolver 403 ante ciertos errores que no son de permisos.
- “Hoy” aparece en el centro sólo para la fecha actual; los controles laterales muestran fechas adyacentes. En otros días aparece “Volver a hoy”.
- Disponibilidad ofrece casillas por día, “Lunes a viernes”, “Toda la semana” y “Limpiar”. Se propone 08:00–20:00 como formulario nuevo, no como lectura de plantillas existentes.
- La duración es fija en 40 minutos: no hay campo editable ni se envía una duración desde el cliente. Sólo se guarda el horizonte de reserva.
- Guardar varios días realiza una petición por día, secuencialmente. No es una única transacción: si falla, se informan éxitos parciales y quedan seleccionados los pendientes.
- GeneracionMensual habilita un mes por operación. El backend conserva reservas e historial; al terminar se actualiza el calendario. No hay cambio de duración ni regeneración asociada. “Próximo horario libre” muestra la primera alternativa.

Ambas pantallas usan el mismo calendario semanal: dos peticiones por día más una consulta de excepciones por semana (15 en total). Los colores se resuelven en `lib/agendaVisual.ts`; `LeyendaAgenda` los explica sin depender sólo del color. Reprogramaciones consulta un DTO con contacto, sin pedir un paciente por fila. Mantener esta particularidad visible en análisis de rendimiento. Ver [arquitectura](../docs/arquitectura.md) y [manual](../docs/manual-usuario.md).
