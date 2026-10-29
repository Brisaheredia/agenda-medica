# Cambios documentados

Registro de cambios relevantes inspeccionados, no historial exhaustivo de cada commit ni acta de liberación productiva.

## 29 de octubre de 2026 — Alcance definitivo y modularidad

- Se conserva el horario habitual confirmado (lunes a viernes, 08:00–20:00, 40 minutos) y la habilitación del mes actual y tres meses calendario futuros completos, definida internamente.
- Se retiró el flujo de **apertura extraordinaria** de la interfaz y del POST de API. Los registros APERTURA históricos siguen siendo legibles; no habilitan nuevas reservas fuera del horario fijo.
- `AgendaService` mantiene cierres con previsualización y confirmación transaccional; no se eliminan compromisos ni eventos previos.
- `PlanificacionHorariosService` concentra la generación mensual y `DiaCalendarioAgenda` permite reutilizar representación de días entre Semana y Rango.
- Se actualizó la documentación de RF/RNF, API, arquitectura, manual, permisos y trazabilidad para distinguir análisis inicial y alcance acordado. Se retocaron referencias obsoletas de pruebas existentes, sin ejecutar la suite formal.

Las referencias a anticipación en días, aperturas o plantillas editables que siguen más abajo corresponden a **hitos históricos** del proyecto, no al contrato vigente.

## Cuentas de desarrollo en instalaciones independientes

Con perfil `dev`, cada backend crea en su propia BD las cuentas de prueba faltantes para los cuatro roles. Las credenciales pueden configurarse por entorno y las cuentas existentes conservan contraseña, rol y estado. La inicialización puede deshabilitarse y no se activa fuera de `dev`. Se documentan pasos y claves públicas de prueba para el equipo. Validación: 197 pruebas backend aprobadas, incluida la creación e ingreso de los cuatro roles en MySQL nuevo descartable.

## Fechas, disponibilidad y seguimiento de reprogramaciones

Fecha y hora de negocio explícitas en Buenos Aires, controles de fecha en español y horario inicial 08:00 en Bloqueos y excepciones. Disponibilidad organiza los días a la izquierda, la configuración y generación a la derecha y el calendario debajo; oculta horarios antiguos vacíos y quita avisos repetidos de duración. La anticipación inicial es de 45 días y sigue siendo configurable. La procedencia de reprogramación del consultorio se conserva en BD y se muestra con una etiqueta; el menú avisa con un contador titilante si hay pendientes. Validación: 190 pruebas backend y 15 frontend aprobadas; build de frontend correcto.

| Commit | Cambio y efecto |
|---|---|
| `1f53aa0` | Backend(fix): unifica fechas y horas en Buenos Aires y prueba límites de medianoche. |
| `42d2bdc` | Backend(feat): conserva la procedencia de reprogramaciones del consultorio e incorpora SQL de recuperación con evidencia explícita. |
| `53c5e3c` | Backend(fix): establece la anticipación inicial en 45 días. |
| `66e29bf` | Frontend(fix): normaliza fechas, horarios y controles en español; Bloqueos propone inicio a las 08:00. |
| `0d6f6c9` | Frontend(feat): reorganiza Disponibilidad y destaca reprogramaciones pendientes. |

## Roles, permisos y administración de cuentas

Cuatro roles según matriz acordada: autorización HTTP, permisos de interfaz, datos mínimos para Obras sociales y pantalla de usuarios para Administración. Cambio de rol/contraseña invalida sesiones anteriores y se protege al último administrador activo. Pruebas HTTP y de render por rol, y persistencia en MySQL de prueba. Las contraseñas de la instalación se entregan por separado.

| Commit | Cambio y efecto |
|---|---|
| `6f235f9` | Backend(feat): permisos para los cuatro roles, gestión de credenciales y pruebas de autorización/persistencia. |
| `c354c45` | Frontend(feat): menús y acciones según rol, pantalla de usuarios y pruebas de interfaz. |

## 17 de octubre de 2026

| Commit | Cambio y efecto |
|---|---|
| `22e7a12` | Frontend(feat): colores compartidos, domingo rojizo, contactos para reprogramar y generación mensual con 40 minutos fijos. |
| `671def8` | Backend(feat): origen de cancelación, pendientes con contacto, turnos fijos de 40 y protección de cierres/superposiciones; 23 pruebas aprobadas. |
| `96fc37a` | Frontend(fix): muestra fecha seleccionada y días adyacentes; Hoy sólo para fecha actual y retorno explícito a hoy. |
| `6999346` | Frontend(feat): selección de varios días, atajo lunes–viernes, horario propuesto 08:00–20:00, duración semanal desde configuración guardada y recarga del calendario. Corrige profesionalId omitido en consulta. |
| `c93ccc0` | backend(fix): duración inicial de ConfiguracionAgenda a 40 minutos; no migra configuración persistida ni seed. |

Se incorpora documentación versionada con README general, frontend/backend, manual, instalación, requisitos, arquitectura/datos/API, pruebas, trazabilidad, operación y mantenimiento. Base de código revisada: `96fc37a`. Se reorganizan los documentos de etapas anteriores en `docs/historico` y se incluye la especificación original como referencia. Los ejemplos generales usan API 8080/MySQL 3306, configurables por entorno. Los diagramas de arquitectura, reserva, entidades y estados se mantienen en Mermaid.

## Limpieza de documentación obsoleta

Después de la reorganización se elimina la carpeta `docs/historico`, incluidos los documentos de primera etapa y etapa final del frontend. Se actualizan índices, enlaces y reglas de mantenimiento para conservar sólo documentación vigente en el árbol de trabajo. Las versiones anteriores siguen disponibles en Git. La especificación original se mantiene únicamente como fuente de requisitos.

## Colores y reprogramaciones — 17 de octubre de 2026

- Colores compartidos por agenda diaria/semanal y Disponibilidad; domingo rojizo y leyenda textual.
- Origen de cancelación PACIENTE/CONSULTORIO persistido sin clasificar retrospectivamente registros antiguos.
- Reprogramaciones con nombre, DNI, contacto, horario y motivo; recuperable desde BD, excluye cancelaciones del paciente y resuelve de a un turno.
- Liberación y reserva revalidan cierres; reprogramación permite cancelados por consultorio, conserva ID/eventos y deja cerrado el horario suspendido.
- Bloqueo del turno y orden de bloqueo de franjas para cambios concurrentes. DisponibilidadService y AgendaConsultaService separan políticas/lecturas.
- SQL aditivo para esquemas manuales; sin ejecutar migración sobre la BD operativa. Manual, API, modelo Mermaid y trazabilidad actualizados.
- Ocho pruebas unitarias y nueve de integración aprobadas; build frontend aprobado. Permisos conservados y pendientes de definición funcional por pedido del responsable.

## Duración fija — decisión final, 17 de octubre de 2026

- Turnos de 40 minutos fijos; se retira edición de duración y se rechazan otros valores desde API/servicios.
- Se conserva generación por mes y horizonte configurable. Se eliminan regeneración por cambio de duración y migración mensual.
- Limpieza de franjas futuras de otra duración sólo si están libres y sin referencias de citas/eventos. Ante otros conflictos se revierte toda la operación y se conserva historia.
- Reservas/aperturas/generación validan intervalos y comparten bloqueo del profesional. El seed ya no genera horarios.
- 23 pruebas backend aprobadas (14 integración, 9 unitarias), build frontend y comprobaciones con API simulada. Permisos y aceptación visual siguen pendientes.
