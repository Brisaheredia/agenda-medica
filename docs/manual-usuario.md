# Manual de uso de Agenda Médica

Guía para administración, recepción y médico. Describe la interfaz del commit `96fc37a`. Para instalar la aplicación, utilizar [instalación](instalacion-configuracion.md).

El horario acordado es lunes a viernes de **08:00 a 20:00**, con turnos estándar inicialmente de **40 minutos**. El administrador puede cambiar la configuración; verificar su valor guardado antes de habilitar nuevos horarios.

## Acceso y permisos

Abrir la dirección entregada por soporte, ingresar email y contraseña y pulsar **Ingresar**. La cabecera muestra cuenta y rol. El icono de salida permite cerrar sesión. No hay recuperación de contraseña ni administración de usuarios desde una pantalla específica; solicitar esa gestión al administrador.

| Operación | Administración | Recepción | Médico |
|---|---|---|---|
| Consultar agenda y pacientes | Sí | Sí | Sí |
| Alta, edición y desactivación de pacientes | Sí | Sí | No |
| Reservar, cancelar y reprogramar | Sí | Sí | No |
| Marcar atendido o ausente | Sí | No | Sí |
| Configurar horarios, cierres y aperturas | Sí | No | No |
| Consultar auditoría | Sí | No | No |

Estos son los permisos actuales. La participación de recepción y médico en configuración/asistencia debe confirmarse contra la matriz de actores del documento inicial. Si la sesión vence, volver a ingresar. Un mensaje de permisos debe informarse con la pantalla y operación realizadas, sin compartir contraseña ni token.

## Preparar la agenda por primera vez

Entrar en **Disponibilidad** con Administración. La pantalla tiene calendario, configuración y dos pasos para habilitar la atención.

### Guardar configuración

1. En **Configuración de agenda**, verificar **Duración estándar de turno: 40**.
2. Elegir la **Anticipación máxima para reservar**, por ejemplo 90 días si esa es la política vigente.
3. Pulsar **Guardar configuración** y esperar confirmación.

Editar un campo sin guardar no cambia la configuración vigente. Cambiar la duración no modifica automáticamente los turnos ya dados ni los horarios generados anteriormente.

### Elegir días y horario

1. En **1. Días y horario de atención**, pulsar **Lunes a viernes**. También se puede marcar o desmarcar cada día; **Toda la semana** incluye sábado y domingo, y **Limpiar** quita todos.
2. Verificar **Desde 08:00** y **Hasta 20:00**. Son horarios editables del formulario.
3. Verificar el texto que informa la duración tomada de la configuración guardada.
4. Elegir **Vigente desde** y, si corresponde, **Vigente hasta**.
5. Pulsar **Guardar horario para 5 días**. El número cambia con la selección.

Un horario común se guarda para los días elegidos. Para horarios distintos, realizar otra carga con los días correspondientes. Si se informa un error parcial, los días guardados ya fueron registrados: quedan seleccionados sólo los pendientes para reintentar. No volver a marcar los guardados para ese mismo intento.

La pantalla todavía no lista las reglas existentes ni permite editarlas/eliminarlas. No repetir una carga para “ver qué pasa”: primero consultar a soporte si ya se configuró ese período.

### Habilitar las fechas

1. En **2. Habilitar horarios para reservar**, indicar fechas **Desde** y **Hasta** dentro de la anticipación permitida.
2. Pulsar **Habilitar horarios**.
3. Leer cuántos horarios se crearon, ya existían o se omitieron por cierres. El calendario se actualiza al finalizar; navegar a la semana habilitada si fuera otra.

Guardar los días/horarios y habilitar fechas son dos pasos distintos. Sin habilitación no aparecen los nuevos horarios para reservar. Un día continuo de 08:00 a 20:00 con 40 minutos debería producir **18 horarios**, desde 08:00–08:40 hasta 19:20–20:00, siempre que no haya cierres ni datos previos incompatibles.

## Registrar y buscar pacientes

Entrar en **Pacientes**. Buscar por DNI completo o apellido y pulsar **Buscar**. La búsqueda por teléfono/email no está implementada. **Limpiar** vuelve al listado inicial; no se muestra todo el padrón en una sola carga.

**Nuevo paciente** abre el formulario: DNI, nombre y apellido obligatorios; teléfono y email opcionales. Registrar contacto cuando se necesite coordinar cambios. Un DNI ya existente produce conflicto. Para corregir datos, pulsar **Editar**; **Desactivar** pide confirmación y conserva el historial. Un paciente inactivo deja de aparecer en búsqueda y no puede recibir una reserva nueva.

También se puede dar de alta un paciente desde **Asignar turno**; al guardarlo queda seleccionado para esa reserva.

## Consultar y navegar la agenda

En **Agenda**, elegir **Día** o **Semana**. En día, el centro muestra **Hoy** sólo si la fecha seleccionada es la actual; los botones laterales muestran las fechas anterior y siguiente. En otra fecha aparece **Volver a hoy**. El selector permite ir directamente a una fecha y **Actualizar** vuelve a consultar los datos.

En semana se muestran siete días y se puede entrar a uno para gestionarlo. Los filtros del día permiten ver disponibles, reservados, atendidos, ausentes, bloqueados y cancelados. El resumen cuenta franjas, disponibilidad futura y turnos reservados/confirmados. No es un reporte de actividad por período.

## Asignar un turno

1. Elegir una franja libre futura desde la lista o el selector **Horario disponible**.
2. Buscar y seleccionar el paciente, o registrarlo como nuevo.
3. Completar un motivo breve si corresponde; no usar este campo como historia clínica.
4. Pulsar **Confirmar turno** y esperar el resultado.

Si otra persona ocupó la franja, el sistema informa conflicto y actualiza la agenda. Elegir otra alternativa; no considerar reservado un turno sin confirmación de guardado.

**Buscar próximo horario libre** muestra la primera alternativa futura encontrada y permite seleccionarla. No es un listado completo de alternativas entre fechas. Para revisar otras opciones, navegar a otro día o consultar la semana.

## Cancelar, reprogramar y registrar atención

**Cancelar:** abrir la acción del turno activo, escribir motivo obligatorio y confirmar. El registro cancelado queda visible con su filtro. En condiciones normales libera el horario.

**Reprogramar:** abrir la acción del turno, elegir nueva fecha, seleccionar un horario disponible y confirmar. El motivo es opcional en el formulario actual. Se mantiene el mismo turno y se registra el cambio. Si el nuevo horario no puede reservarse, la operación debe conservar el compromiso original y mostrar el error.

**Atendido o ausente:** Administración/Médico pueden registrar el resultado una vez alcanzado el inicio del turno. Confirmar la acción en el diálogo. No se permite mover un turno ya ATENDIDO/AUSENTE por el flujo normal.

## Suspender atención o abrir una fecha extraordinaria

En **Bloqueos y excepciones**, Administración elige:

- **Bloquear horarios:** fecha completa o intervalo con motivo opcional.
- **Feriado / día no laborable:** cierre manual de la fecha; no descarga feriados automáticamente.
- **Apertura extraordinaria:** fecha, intervalo y duración. El formulario todavía propone 30 minutos de manera independiente: seleccionar expresamente la duración vigente de 40 antes de guardar, si corresponde.

Un cierre conserva turnos ya reservados e informa sus identificadores. **Todavía falta la lista con nombres/teléfonos y resolución desde ella**. Hasta que exista, ubicar los turnos en Agenda y los contactos en Pacientes para coordinar manualmente.

Hay un defecto pendiente: cancelar o mover un turno dentro de un cierre puede mostrar su horario anterior como libre. No reasignar ese horario si el consultorio sigue cerrado; informar a soporte. Este manual no presenta ese flujo como validado para operación real sin corregirlo.

## Auditoría y ayuda

Administración puede abrir **Auditoría**, actualizar y filtrar los últimos 100 eventos cargados por acción, entidad, identificador o detalle. El filtro no busca en todo el historial.

| Situación | Acción |
|---|---|
| No aparecen horarios | Verificar día/semana, filtros y que se hayan habilitado fechas |
| No hay profesional | Solicitar configuración a soporte |
| No se puede confirmar | Revisar paciente, franja futura y mensaje del sistema |
| Un cambio falla parcialmente al guardar días | Reintentar sólo los días que quedaron seleccionados |
| Mensaje de sesión o permisos | Volver a ingresar si venció; informar operación y rol si persiste |
| Se necesita lista de afectados o historial detallado | Son capacidades pendientes, no opciones ocultas del menú |

No existe modo demo activo en esta versión. Usar datos ficticios únicamente en una base de prueba identificada por soporte.
