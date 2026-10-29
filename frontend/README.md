# Frontend de Agenda Médica

Interfaz React para personal del consultorio. Código en `frontend/`, dentro del repositorio. Actualizado con alcance final y modularización, 29 de octubre de 2026.

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
npm test
npm run build
npm run preview
```

`build` ejecuta TypeScript y genera `dist/`; `preview` sirve ese resultado para revisión local. `npm test` verifica menús, rutas y botones por rol con Node y render de React. No hay lint configurado ni prueba visual automatizada.

## Rutas y responsabilidades

| Ruta | Pantalla | Función |
|---|---|---|
| `/` | Agenda | Día/semana/rango, reserva y acciones de turno |
| `/pacientes` | Pacientes | Búsqueda, alta, edición y baja lógica |
| `/disponibilidad` | Disponibilidad | Horario fijo en consulta y generación mensual de franjas de 40 minutos |
| `/bloqueos` | Suspensiones | Cierre parcial o total y día no laborable manual |
| `/reprogramaciones` | Reprogramaciones | Pacientes afectados, contacto y cambio de horario manual |
| `/auditoria` | Auditoría | Últimos eventos; sólo ADMIN |
| `/usuarios` | Usuarios y roles | Alta, rol, estado y contraseña; sólo ADMIN |

El login se muestra al no existir sesión, sin ruta `/login` independiente. La navegación usa History API mediante `usePathname`; el hosting debe devolver `index.html` al recargar rutas de la SPA.

`App.tsx` compone sesión/rutas y coordina acciones; `pages/` implementa pantallas; `components/` contiene calendarios, reserva y diálogos; `hooks/useAgenda.ts` carga agenda diaria; `api.ts` centraliza fetch, JWT y errores; `types.ts` contiene tipos y funciones de fecha; `styles.css` define estilos. No existe `src/demo.ts` en esta base.

## Reglas de interfaz importantes

- Sesión almacenada en `localStorage` bajo `agendaSesion`. El rol mostrado no reemplaza la autorización del backend.
- HTTP 401 cierra sesión; HTTP 403 muestra falta de permisos. `permisos.ts` concentra la matriz de la interfaz; la API vuelve a autorizar cada operación. Ver [roles y permisos](../docs/roles-permisos.md).
- “Hoy” aparece en el centro sólo para la fecha actual; los controles laterales muestran fechas adyacentes. En otros días aparece “Volver a hoy”.
- `lib/fechas.ts` determina “hoy” y presenta los horarios en Buenos Aires. Las fechas civiles se operan sin depender de la zona del navegador. `FechaInput` muestra día/mes/año en español y la generación mensual ofrece meses en español sin usar calendarios nativos.
- Disponibilidad muestra el horario fijo de lunes a viernes, 08:00–20:00, con 40 minutos por turno; no ofrece editar días, vigencias ni duración.
- `GeneracionMensual` habilita un mes por operación: mes actual (desde hoy) o cualquiera de los tres meses futuros completos. Generación y reserva comparten ese límite.
- Las suspensiones se revisan antes de confirmarse; no hay opción de apertura extraordinaria. Las acciones muestran información sin depender solo de colores.
- Semana y Rango usan `DiaCalendarioAgenda` para representar días y franjas con las mismas reglas visuales, manteniendo navegación propia. Ambos consumen el endpoint por rango, evitando las 15 peticiones originales de Semana.
- `api.ts` centraliza JWT y errores; `permisos.ts` controla lo visible, mientras el backend autoriza cada operación. Reprogramaciones consulta contactos en un DTO sin una consulta por paciente.
- La marca de procedencia de reprogramación se obtiene del backend, no se deduce de motivos escritos por los operadores.

`useReprogramaciones` comparte los pendientes entre el menú y la pantalla de contactos. El menú muestra un contador titilante cuando hay pendientes. Refresca al operar la agenda, bloquear atención, volver a la ventana y cada 30 segundos mientras está visible; aborta solicitudes y limpia temporizadores al cambiar de sesión/profesional. Sólo consulta para roles con acceso a contactos. Un fallo transitorio conserva el último resultado y se informa en Reprogramaciones.
