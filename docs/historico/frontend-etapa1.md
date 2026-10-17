> Documento histórico. Consultar la [documentación vigente](../README.md) antes de utilizar estas instrucciones.

# Primera etapa del frontend

Se implementó la Agenda diaria, utilizando su estructura, paleta de colores y logo, y adaptándola al alcance del proyecto. No se modificaron los controladores ni las reglas de negocio del backend.

## Qué incluye

- Acceso con la sesión y roles existentes.
- Fecha, navegación por día y actualización manual.
- Línea de tiempo con franjas libres, bloqueadas y turnos.
- Filtros de disponibilidad y estado; registro visible de cancelados.
- Resumen calculado desde los datos de la API. “Disponibles” cuenta franjas futuras que se pueden reservar.
- Asignación con selección de franja y búsqueda de paciente, sin promesas de mensajería.
- Alta de paciente dentro de un diálogo que lo deja seleccionado para la reserva.
- Cancelación con motivo y confirmación.
- Reprogramación manual a otro día con consulta de horarios disponibles.
- Registro confirmado de atendido o ausente, según rol y horario.
- Manejo de errores, HTTP 409, sesión vencida y prevención de envíos simultáneos.
- Adaptación a escritorio y móvil, navegación estándar de teclado y diálogos con foco gestionado por el navegador.

El backend actual admite CONFIRMADO además de los estados principales del SRS abreviado. Se conserva su visualización sin agregar un flujo de confirmación por SMS/WhatsApp.

Se toma el primer profesional activo informado por la API, de acuerdo con el alcance de consultorio individual. No se añadió gestión de múltiples profesionales.

## Qué queda pendiente

Las secciones independientes de Pacientes, Disponibilidad, Bloqueos y excepciones, y Auditoría están deshabilitadas e identificadas como pendientes en el menú. No son pantallas implementadas. El alta y la búsqueda de pacientes sí funcionan dentro de la asignación.

La Agenda muestra bloqueos existentes; crear/deshacer bloqueos y generar disponibilidad pertenecen a etapas posteriores. No se añadieron historia clínica, sala de espera, recordatorios, sincronización con feriados, pagos, reportes avanzados ni reprogramación automática.

## Modo interactivo de demostración

Desde el acceso, elegir **Probar con datos de ejemplo**, No requiere cuenta, servidor ni base de datos. Al ingresar se muestran los horarios de mañana para que siempre haya franjas futuras reservables.

La demostración usa un almacén separado en memoria y jamás envía solicitudes al backend. Permite buscar pacientes ficticios, crear pacientes, reservar, cancelar, reprogramar entre fechas y registrar atención/ausencia en turnos pasados. Los nombres y datos son ejemplos. La sesión real guardada se conserva al entrar y salir.

**Reiniciar ejemplos** restaura pacientes, horarios, fecha y formularios. Recargar también descarta todos los cambios de demostración.

**Salir de la demostración** vuelve al acceso o a la sesión real previamente guardada. El menú de las demás pantallas sigue pendiente.
