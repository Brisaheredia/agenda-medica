# Manual de uso de Agenda Médica

Guía para Administración, Médico, Recepción y Obras sociales. Para instalar la aplicación, utilizar [instalación](instalacion-configuracion.md).

El horario acordado es lunes a viernes de **08:00 a 20:00**, con turnos de **40 minutos fijos**. La duración no se edita. La anticipación máxima para reservar sigue siendo configurable.

## Acceso y permisos

Abrir la dirección entregada por soporte, ingresar email y contraseña y pulsar **Ingresar**. La cabecera muestra cuenta y rol. El icono de salida permite cerrar sesión. Si se olvidó la contraseña, Administración puede restablecerla desde **Usuarios**.

La [matriz de roles y permisos](roles-permisos.md) detalla cada operación. Todos consultan agenda y disponibilidad. Administración y Recepción gestionan pacientes; también asignan, cancelan y reprograman, al igual que Obras sociales. Médico y Administración modifican horarios y bloquean atención. Administración, Médico y Recepción registran atendido/ausente. Sólo Administración gestiona usuarios, auditoría y configuración general.

Los menús y botones se adaptan al rol. Obras sociales selecciona pacientes existentes con datos mínimos, sin alta ni edición, y reprograma desde la agenda; no consulta contactos ni motivos de consulta. Si la sesión vence o Administración cambia el rol o contraseña, volver a ingresar.

## Preparar la agenda por primera vez

Entrar en **Disponibilidad** con Administración o Médico para definir días y generar horarios. Todos los roles pueden consultar el calendario. Sólo Administración ve y modifica la configuración de anticipación máxima.

### Guardar configuración

1. En **Configuración de agenda** se informa **Duración fija: 40 minutos**; no es editable.
2. Elegir la **Anticipación máxima para reservar**, por ejemplo 90 días si esa es la política vigente.
3. Pulsar **Guardar configuración** y esperar confirmación.

La configuración editable es la anticipación máxima. La duración de 40 minutos es una regla fija; no existe cambio de duración ni regeneración por ese motivo.

### Elegir días y horario

1. En **1. Días y horario de atención**, pulsar **Lunes a viernes**. También se puede marcar o desmarcar cada día; **Toda la semana** incluye sábado y domingo, y **Limpiar** quita todos.
2. Verificar **Desde 08:00** y **Hasta 20:00**. Son horarios editables del formulario.
3. Verificar el texto que informa que cada turno dura 40 minutos.
4. Elegir **Vigente desde** y, si corresponde, **Vigente hasta**.
5. Pulsar **Guardar horario para 5 días**. El número cambia con la selección.

Un horario común se guarda para los días elegidos. Para horarios distintos, realizar otra carga con los días correspondientes. Si se informa un error parcial, los días guardados ya fueron registrados: quedan seleccionados sólo los pendientes para reintentar. No volver a marcar los guardados para ese mismo intento.

La pantalla todavía no lista las reglas existentes ni permite editarlas/eliminarlas. No repetir una carga para “ver qué pasa”: primero consultar a soporte si ya se configuró ese período.

### Habilitar el mes

1. Guardar los días y horarios de atención.
2. En **2. Habilitar horarios del mes**, elegir el mes. Su último día debe estar dentro de la anticipación máxima configurada.
3. Pulsar **Habilitar horarios**. Se informa cuántos se crearon, ya existían o se omitieron por cierres.
4. Consultar la semana habilitada; el calendario se actualiza al finalizar.

Se procesa un mes por vez. Los 90 días son un límite de anticipación, no una generación automática. Todos los horarios nuevos duran 40 minutos; 08:00–20:00 produce 18 por día sin cierres. Repetir no duplica horarios ni cambia turnos asignados.

Al habilitar el período se retiran únicamente franjas futuras de otra duración que estén LIBRES y sin turnos ni eventos históricos. Si un horario antiguo tiene compromisos o historial y se superpone con la grilla, se informa conflicto y se revierte toda la operación; no se borran citas ni se cancelan pacientes automáticamente. Las reservas antiguas conservan sus tiempos registrados, pero una franja de otra duración no admite reservas nuevas. No hace falta la migración mensual propuesta anteriormente.

## Registrar y buscar pacientes

Entrar en **Pacientes**. Buscar por DNI completo o apellido y pulsar **Buscar**. La búsqueda por teléfono/email no está implementada. **Limpiar** vuelve al listado inicial; no se muestra todo el padrón en una sola carga.

**Nuevo paciente** abre el formulario: DNI, nombre y apellido obligatorios; teléfono y email opcionales. Registrar contacto cuando se necesite coordinar cambios. Un DNI ya existente produce conflicto. Para corregir datos, pulsar **Editar**; **Desactivar** pide confirmación y conserva el historial. Un paciente inactivo deja de aparecer en búsqueda y no puede recibir una reserva nueva.

También se puede dar de alta un paciente desde **Asignar turno**; al guardarlo queda seleccionado para esa reserva.

## Consultar y navegar la agenda

En **Agenda**, elegir **Día** o **Semana**. En día, el centro muestra **Hoy** sólo si la fecha seleccionada es la actual; los botones laterales muestran las fechas anterior y siguiente. En otra fecha aparece **Volver a hoy**. El selector permite ir directamente a una fecha y **Actualizar** vuelve a consultar los datos.

En semana se muestran siete días y se puede entrar a uno para gestionarlo. Los filtros del día permiten ver disponibles, reservados, atendidos, ausentes, bloqueados y cancelados. El resumen cuenta franjas, disponibilidad futura y turnos reservados/confirmados. No es un reporte de actividad por período.

Los colores se comparten con Disponibilidad:

| Color | Significado |
|---|---|
| Rojo | Cierre o cancelación del consultorio; un turno activo afectado necesita reprogramación |
| Naranja | Cancelación solicitada por el paciente |
| Verde | Horario futuro disponible |
| Azul | Turno ocupado, atendido o ausente; el texto precisa el resultado |
| Gris claro | Sin horarios, horario pasado o cancelación antigua sin origen registrado |

El domingo tiene fondo rojizo. Cada horario conserva su estado aunque el día contenga varios colores. El encabezado prioriza cierres, luego disponibilidad, cancelaciones del paciente y ocupación. Un domingo rojizo por sí solo no significa cierre: leer sus horarios y etiquetas.

## Asignar un turno

1. Elegir una franja libre futura desde la lista o el selector **Horario disponible**.
2. Buscar y seleccionar el paciente, o registrarlo como nuevo.
3. Completar un motivo breve si corresponde; no usar este campo como historia clínica.
4. Pulsar **Confirmar turno** y esperar el resultado.

Si otra persona ocupó la franja, el sistema informa conflicto y actualiza la agenda. Elegir otra alternativa; no considerar reservado un turno sin confirmación de guardado.

**Buscar próximo horario libre** muestra la primera alternativa futura encontrada y permite seleccionarla. No es un listado completo de alternativas entre fechas. Para revisar otras opciones, navegar a otro día o consultar la semana.

## Cancelar, reprogramar y registrar atención

**Cancelar:** abrir la acción del turno activo, escribir motivo y elegir quién solicitó la cancelación. Si llamó el paciente, se muestra en naranja y libera el horario sólo cuando no existe un cierre. Si suspendió el médico/consultorio, se muestra en rojo, bloquea ese horario y agrega el paciente a Reprogramaciones. Los registros antiguos sin origen quedan grises; no se supone que los canceló el paciente.

**Reprogramar:** abrir la acción del turno, elegir **Buscar horarios desde**, seleccionar entre las alternativas futuras dentro del horizonte y confirmar. El motivo es opcional en el formulario actual. Se mantiene el mismo turno y se registra el cambio. Si el nuevo horario no puede reservarse, la operación debe conservar el compromiso original y mostrar el error.

**Atendido o ausente:** Administración, Médico y Recepción pueden registrar el resultado una vez alcanzado el inicio del turno. Confirmar la acción en el diálogo. No se permite mover un turno ya ATENDIDO/AUSENTE por el flujo normal.

## Suspender atención o abrir una fecha extraordinaria

En **Bloqueos y excepciones**, Administración o Médico elige:

- **Bloquear horarios:** fecha completa o intervalo con motivo opcional.
- **Feriado / día no laborable:** cierre manual de la fecha; no descarga feriados automáticamente.
- **Apertura extraordinaria:** fecha e intervalo; usa la duración fija de 40 minutos, mostrada como lectura. Rechaza intervalos superpuestos con franjas vigentes. Una apertura no elimina un cierre existente.

Un cierre conserva los turnos y muestra un enlace a **Reprogramaciones** con la cantidad de afectados. Cancelar o mover un turno no habilita su horario anterior si sigue cerrado.

## Llamar y reprogramar pacientes afectados

1. Abrir **Reprogramaciones** en el menú, o el enlace que aparece tras bloquear horarios.
2. Consultar nombre, DNI, teléfono, email, fecha/hora original y motivo de suspensión. Se puede filtrar por paciente/contacto y fecha original.
3. Llamar para coordinar un nuevo horario. Si falta contacto, completarlo desde Pacientes.
4. Pulsar **Reprogramar**, buscar desde una fecha y seleccionar una alternativa disponible.
5. Confirmar: se conserva la identidad e historial y el turno desaparece de pendientes cuando queda fuera del cierre.

La lista se recupera de la BD al volver a entrar; incluye turnos activos afectados por cierres y cancelaciones individuales con origen CONSULTORIO. Excluye cancelaciones del paciente y registros históricos cuyo origen no consta. No envía avisos ni reprograma automáticamente. Consultan Administración, Médico y Recepción; reprograman Administración y Recepción desde esta lista. Obras sociales reprograma desde la agenda sin acceso a los contactos de esta lista.

## Auditoría y ayuda

Administración puede abrir **Auditoría**, actualizar y filtrar los últimos 100 eventos cargados por acción, entidad, identificador o detalle. El filtro no busca en todo el historial.

| Situación | Acción |
|---|---|
| No aparecen horarios | Verificar día/semana, filtros y que se hayan habilitado fechas |
| No hay profesional | Solicitar configuración a soporte |
| No se puede confirmar | Revisar paciente, franja futura y mensaje del sistema |
| Un cambio falla parcialmente al guardar días | Reintentar sólo los días que quedaron seleccionados |
| Mensaje de sesión o permisos | Volver a ingresar si venció; informar operación y rol si persiste |
| Se necesita lista de afectados | Abrir Reprogramaciones |
| Se necesita historial detallado del turno | La pantalla específica sigue pendiente |

No existe modo demo activo en esta versión. Usar datos ficticios únicamente en una base de prueba identificada por soporte.
