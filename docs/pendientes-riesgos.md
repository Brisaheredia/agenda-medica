# Pendientes y riesgos — alcance vigente

**Actualizado:** 03/11/2026. Este registro distingue riesgos técnicos reales, verificación pendiente y funcionalidades explícitamente **fuera del alcance**. No se asignan fechas, responsables ni estados de pruebas sin evidencia.

## Riesgos que pueden afectar la entrega

| ID | Prioridad | Situación y criterio de cierre |
|---|---|---|
| R-01 | Media | Contrastar manual y API con el producto final tras retirar aperturas extraordinarias. Deben permanecer los cierres con vista previa, turnos afectados y reprogramación manual. |
| R-02 | Media | Base de datos con franjas antiguas fuera del horario fijo: no ofrecer nuevas reservas en esas franjas; no borrar turnos históricos. Revisar en el entorno local. |
| R-03 | Media | La documentación y referencias de pruebas conocidas se ajustaron al nuevo alcance. Verificar ejecución y cobertura de la suite actual durante la etapa formal de Testing. |
| R-04 | Media | Revisar versiones de pruebas, compilación completa, restricciones de roles y concurrencia sobre el commit definitivo. La revisión estática no equivale a aceptación. |
| R-05 | Baja en el TP / alta si se despliega | CORS permisivo de desarrollo, configuración de esquema, HTTPS y recuperación de respaldos deben revisarse antes de usar datos reales o desplegar públicamente. |
| R-06 | Baja | La relación obra social se guarda en paciente, no en cada turno. Si Salvador necesita afiliaciones o convenios distintos por reserva, sería otro requisito a validar. |

## Cambios funcionales ya incorporados (inspección de código)

- Alta de pacientes desde Obras Sociales y selector/alta de obra social opcional dentro del formulario.
- Actualización automática de agenda por foco/visibilidad y cada 30 segundos, sin WebSocket.
- Restricción de reprogramaciones por suspensión para Obras Sociales y privacidad de motivos de consulta.
- Visualización condicional de obra social y eliminación del mensaje «Sin motivo informado».


- Búsqueda de pacientes por DNI, apellido, teléfono y email.
- Previsualización y revalidación transaccional de afectados antes de un cierre.
- Agenda por día/semana/rango e historial del turno, con actor y motivo en eventos nuevos.
- Horario fijo lunes a viernes 08:00–20:00, franjas de 40 minutos; habilitación del mes actual y los tres siguientes.
- Modularización de planificación y representación diaria compartida en frontend.
- Retiro de la creación de aperturas extraordinarias; lectura de registros históricos conservada.

## Funcionalidades deliberadamente excluidas

Administración de plantillas, variaciones permanentes del horario habitual, aperturas extraordinarias, reportes periódicos, historia clínica, pagos, recetas, notificaciones, portal paciente, optimización automática de reprogramaciones, sede/profesional múltiple. **No son tickets de corrección pendientes**: requieren un nuevo acuerdo de alcance.

## Próximas actividades académicas

Preparar documento de roles, tareas y herramientas con evidencias reales; revisar repositorio y empaquetado. Formalizar después la suite de Testing exigida por la cátedra, sin inventar resultados. Consultar [requisitos](requisitos.md), [trazabilidad](trazabilidad.md) y [pruebas](pruebas-aceptacion.md).

## Verificaciones pendientes de los cambios de noviembre

- Ejecutar las suites automáticas y guardar la salida de compilación, permisos y doble reserva entre Recepción y Obras Sociales.
- Registrar capturas de alta de paciente y obra social desde el formulario, de la agenda en dos sesiones y de una operación rechazada por permisos.
- El equipo reportó que la suspensión de jornada funciona en la comprobación manual; documentar evidencia en la etapa de Pruebas.
- Consultar a Salvador, cuando corresponda, si necesita registrar **obra social por turno** en lugar de obra social actual del paciente y confirmar identidad visual tomada de su material.
