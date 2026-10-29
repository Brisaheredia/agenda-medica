# Manual de uso de Agenda Médica

Guía para Administración, Médico, Recepción y Obras sociales. Para instalar la aplicación, utilizar [instalación](instalacion-configuracion.md).

El horario acordado es lunes a viernes de **08:00 a 20:00**, con turnos de **40 minutos fijos**. No se edita en este MVP. **Se puede habilitar el mes en curso (desde hoy) y los tres meses calendario siguientes completos.**

## Acceso y permisos

Abrir la dirección entregada por soporte, ingresar email y contraseña y pulsar **Ingresar**. La cabecera muestra cuenta y rol. El icono de salida permite cerrar sesión. Si se olvidó la contraseña, Administración puede restablecerla desde **Usuarios**.

La [matriz de roles y permisos](roles-permisos.md) detalla cada operación. Todos consultan agenda y disponibilidad. Administración y Recepción gestionan pacientes; también asignan, cancelan y reprograman, al igual que Obras sociales. Médico y Administración habilitan los meses y pueden suspender atención; el horario habitual es fijo. Administración, Médico y Recepción registran atendido/ausente. Sólo Administración gestiona usuarios y auditoría.

Los menús y botones se adaptan al rol. Obras sociales selecciona pacientes existentes con datos mínimos, sin alta ni edición, y reprograma desde la agenda; no consulta contactos ni motivos de consulta. Si la sesión vence o Administración cambia el rol o contraseña, volver a ingresar.

## Habilitar horarios del mes

Entrar en **Disponibilidad** con Administración o Médico. La pantalla muestra el horario habitual fijo y permite habilitar los horarios de un mes. Los demás roles pueden consultar el calendario.

1. Elegir el mes en **Habilitar horarios del mes**. Están disponibles el mes actual y los tres meses siguientes. Por ejemplo, en octubre: octubre (desde hoy), noviembre, diciembre y enero.
2. Pulsar **Habilitar horarios**. Se informa cuántos horarios se crearon, ya existían o se omitieron por cierres.
3. Consultar el calendario semanal para ver el resultado.

Los meses futuros se habilitan **del día 1 hasta el último día**; el mes actual, desde la fecha de hoy. Se generan franjas de 40 minutos, de lunes a viernes de 08:00 a 20:00, respetando cierres. Repetir la operación no debe duplicar horarios. Los turnos existentes y su historial se conservan.

Para suspender atención en una fecha concreta se utiliza **Suspensiones de atención**, no una modificación de los horarios habituales. La ventana de generación y la de reserva tienen el mismo límite de tres meses futuros completos.

## Registrar y buscar pacientes

Entrar en **Pacientes**. Buscar por DNI completo, apellido, teléfono o email y pulsar **Buscar**. **Limpiar** vuelve al listado inicial; no se muestra todo el padrón en una sola carga.

**Nuevo paciente** abre el formulario: DNI, nombre y apellido obligatorios; teléfono y email opcionales. Registrar contacto cuando se necesite coordinar cambios. Un DNI ya existente produce conflicto. Para corregir datos, pulsar **Editar**; **Desactivar** pide confirmación y conserva el historial. Un paciente inactivo deja de aparecer en búsqueda y no puede recibir una reserva nueva.

También se puede dar de alta un paciente desde **Asignar turno**; al guardarlo queda seleccionado para esa reserva.

## Consultar y navegar la agenda

En **Agenda**, elegir **Día**, **Semana** o **Rango** (hasta 90 días). En día, el centro muestra **Hoy** sólo si la fecha seleccionada es la actual; los botones laterales muestran las fechas anterior y siguiente. En otra fecha aparece **Volver a hoy**. El selector permite ir directamente a una fecha y **Actualizar** vuelve a consultar los datos.

La etiqueta **Reprogramado por el consultorio** identifica citas trasladadas después de una cancelación del consultorio o un cierre que afectaba al turno. Aparece en agenda diaria, semanal y en el diálogo del turno; se conserva al recargar y en movimientos posteriores. Un cambio voluntario del paciente no activa esta etiqueta.

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

**Reprogramar:** abrir la acción del turno, elegir **Buscar horarios desde**, seleccionar entre las alternativas futuras dentro del horizonte y confirmar. El motivo de reprogramación es obligatorio. Se mantiene el mismo turno y se registra el cambio. Si el nuevo horario no puede reservarse, la operación debe conservar el compromiso original y mostrar el error.

**Atendido o ausente:** Administración, Médico y Recepción pueden registrar el resultado una vez alcanzado el inicio del turno. Confirmar la acción en el diálogo. No se permite mover un turno ya ATENDIDO/AUSENTE por el flujo normal.

## Suspender atención

En **Suspensiones de atención**, Administración o Médico puede cerrar una fecha completa, o solamente un intervalo. **Feriado / día no laborable** es un atajo para cerrar el día; no hay sincronización automática de feriados. El horario habitual de lunes a viernes, 08:00–20:00 no se modifica. **Solo se pueden suspender fechas de lunes a viernes**: el selector deshabilita sábados y domingos, porque no son días de atención. Si se abre la pantalla en fin de semana, propone el siguiente día hábil.

1. Elegir fecha, intervalo opcional y motivo.
2. Pulsar **Revisar turnos afectados**. El sistema muestra cantidad, pacientes y horarios antes de realizar cambios.
3. Confirmar el cierre, o regresar al formulario. Si la lista cambió durante la operación, el backend rechaza la confirmación y solicita revisar de nuevo.
4. Los turnos afectados quedan conservados para contactar y reprogramar manualmente a los pacientes.

La versión actual **no ofrece apertura extraordinaria**. Los registros históricos de aperturas permanecen en la base, pero no autorizan nuevas reservas fuera del horario fijo.

## Llamar y reprogramar pacientes afectados

Cuando hay pendientes, **Reprogramaciones** muestra en el menú un contador rojo titilante. Desaparece al resolver todos. Se actualiza al realizar operaciones de agenda, volver a la ventana y cada 30 segundos mientras la aplicación está visible. El contador representa el total, aunque se filtre la lista. Si el dispositivo solicita reducir movimiento, conserva el aviso sin animación.

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
| Mensaje de sesión o permisos | Volver a ingresar si venció; informar operación y rol si persiste |
| Se necesita lista de afectados | Abrir Reprogramaciones |
| Se necesita historial detallado del turno | Abrir **Historial** desde las acciones del turno; los eventos antiguos pueden carecer de usuario registrado |

No existe modo demo activo en esta versión. Usar datos ficticios únicamente en una base de prueba identificada por soporte.
