# Pendientes y riesgos — alcance vigente

**Actualizado:** 29/10/2026. Este registro distingue riesgos técnicos reales, verificación pendiente y funcionalidades explícitamente **fuera del alcance**. No se asignan fechas, responsables ni estados de pruebas sin evidencia.

## Riesgos que pueden afectar la entrega

| ID | Prioridad | Situación y criterio de cierre |
|---|---|---|
| R-01 | Media | Contrastar manual y API con el producto final tras retirar aperturas extraordinarias. Deben permanecer los cierres con vista previa, turnos afectados y reprogramación manual. |
| R-02 | Media | Base de datos con franjas antiguas fuera del horario fijo: no ofrecer nuevas reservas en esas franjas; no borrar turnos históricos. Revisar en el entorno local. |
| R-03 | Media | La documentación y referencias de pruebas conocidas se ajustaron al nuevo alcance. Verificar ejecución y cobertura de la suite actual durante la etapa formal de Testing. |
| R-04 | Media | Revisar versiones de pruebas, compilación completa, restricciones de roles y concurrencia sobre el commit definitivo. La revisión estática no equivale a aceptación. |
| R-05 | Baja en el TP / alta si se despliega | CORS permisivo de desarrollo, configuración de esquema, HTTPS y recuperación de respaldos deben revisarse antes de usar datos reales o desplegar públicamente. |
| R-06 | Baja | Posible consulta adicional por turno en agenda diaria; medir N+1/costo SQL si el volumen crece. No justificar una reestructuración grande sin datos. |

## Cambios funcionales ya incorporados (inspección de código)

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
