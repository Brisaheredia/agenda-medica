# Alcance y requisitos — Agenda Médica

**Estado de referencia:** 29 de octubre de 2026, sobre el código de la rama `Gisele` (base `1c2b38e`, más el retiro de aperturas extraordinarias).

## Fuentes y decisión de alcance

La [especificación inicial](referencias/README.md) fue un ejercicio de relevamiento amplio. **No es el conjunto completo de funcionalidades comprometidas para esta entrega.** El equipo envió una propuesta acotada al doctor Salvador, quien confirmó el diagnóstico, informó los horarios y aceptó conservar los turnos afectados por suspensiones. El intercambio queda como fuente del alcance (ver referencias). Las decisiones internas —como generar hasta tres meses futuros completos— son reglas de implementación, **no solicitudes textuales de Salvador**.

## Necesidad del consultorio y versión comprometida

El consultorio utiliza una agenda manual/dispersa: las cancelaciones desaprovechan horarios disponibles y la asignación por distintos canales ocasiona superposiciones. La solución es una **aplicación web centralizada**, administrada por el consultorio para un solo profesional, con:

- Registro y consulta de los datos mínimos de pacientes para identificación y contacto.
- Atención habitual fija **lunes a viernes de 08:00 a 20:00**, turnos de **40 minutos**.
- Generación de franjas mensuales; por decisión técnica, se permite el mes actual y **los tres meses calendario siguientes completos**. Un cierre impide ofrecer sus franjas.
- Consulta de disponibilidad; asignación y cancelación de turnos. Un horario cancelado vuelve a estar disponible **solo si no está bloqueado**.
- Prevención de dobles reservas y compromisos superpuestos, incluso con operaciones concurrentes.
- Suspensión de días o franjas: **advertencia previa**, conservación de los turnos y contactos afectados y reprogramación manual uno a uno. Solo se permiten cierres de lunes a viernes; en fines de semana no hay atención habitual que suspender.

El paciente no se registra ni solicita turnos por una interfaz pública. Quedan fuera historia clínica, recetas, facturación/pagos, recordatorios, portal del paciente, automatización de reprogramaciones, gestión de plantillas con vigencia, aperturas extraordinarias, reportes por período, sedes o profesionales múltiples.

## Funcionalidades complementarias ya implementadas

Autenticación por usuarios/roles, consulta diaria/semanal/por rango, estados atendido/ausente, historial de movimientos y auditoría básica. Algunas exceden el mínimo del correo y se conservaron por utilidad, trazabilidad y porque ya estaban desarrolladas; **no se presentan como pedidos explícitos del cliente** ni justifican nuevas ampliaciones.

## RF originales: correspondencia con el alcance acotado

Se mantienen los identificadores del documento inicial para facilitar la trazabilidad. Las prioridades **no** se heredan automáticamente del borrador inicial.

| RF | Situación en esta versión |
|---|---|
| RF-01 | Implementado: acceso de usuarios del consultorio. |
| RF-02 | Implementado: alta, edición, consulta y búsqueda por DNI, apellido, teléfono o email. |
| RF-03 | Fuera del alcance como editor de días/horarios; horario habitual fijo. |
| RF-04 | Implementado de forma acotada: franjas de 40 minutos según horario fijo y cierres. |
| RF-05 | Implementado: agenda diaria. |
| RF-06 | Implementado: asignación de turno libre a paciente registrado. |
| RF-07 | Implementado: cancelación con fecha, origen, motivo y trazabilidad. |
| RF-08 | Implementado: reprogramación manual con historial. |
| RF-09 | Implementado: bloqueos parciales o por día completo. |
| RF-10 | Implementado: previsualización de afectados antes del cierre. |
| RF-11 | Implementado como complemento: día, semana y rango de hasta 90 días. |
| RF-12 | Implementado como complemento: atendido/ausente. |
| RF-13 | Implementado como complemento: historial consultable del turno. |
| RF-14 | Implementado: búsqueda de alternativas futuras disponibles. |
| RF-15 | **Alcance reducido a cierres**; no se crean aperturas extraordinarias. |
| RF-16 | Excluido: reemplazo/administración de plantillas con vigencia. |
| RF-17 | Implementado: lista de afectados y reprogramación manual individual. |
| RF-18 | Excluido: notificaciones automáticas. |
| RF-19 | Excluido: portal del paciente. |
| RF-20 | Implementado como complemento: auditoría de operaciones críticas. |
| RF-21 | Excluido: reportes por período. |
| RF-22 | Excluido como configuración editable; duración fija y límite de tres meses futuros. La BD conserva campos históricos por compatibilidad. |
| RF-23 | Cubierto con cierre manual de un día no laborable; sin calendario automático de feriados. |
| RF-24 | Protección implementada mediante validación transaccional y bloqueo de la agenda. |

## Reglas de negocio vigentes

- Una franja admite a lo sumo un turno activo; se revalida disponibilidad al confirmar, dentro de la transacción (RN-01 y RN-15).
- No se asignan turnos pasados ni fuera del horario fijo y la ventana de reserva; inicio/fin deben ser consistentes (RN-02, RN-03, RN-12).
- Los cierres prevalecen sobre la disponibilidad y no borran ni liberan automáticamente los turnos comprometidos (RN-05, RN-06, RN-07).
- La cancelación de un turno libera la franja salvo cierre/bloqueo; una reprogramación conserva identidad y evento con usuario, momento, horario original/nuevo y motivo (RN-08, RN-09, RN-11, RN-19).
- Paciente registrado previamente, solo datos necesarios y modificación de agenda sujeta a autorización (RN-10, RN-16, RN-20).
- Los cambios de estado atendido/ausente requieren haber llegado al inicio del turno (RN-18).
- Las reglas sobre **plantillas editables** y **horizonte en días configurable** del análisis inicial no gobiernan esta versión (RN-04, RN-13, RN-14 en su forma inicial). Aquí se aplican la disponibilidad fija y la ventana de meses calendario.

## RNF: objetivos de calidad y evidencia

Los RNF-01 a RNF-20 del documento de referencia se conservan como **objetivos para evaluar** donde corresponda, no como resultados ya demostrados. El código tiene autorización, BCrypt, modularidad en capas, transacciones e índices. **No hay mediciones aprobadas** de latencia p95, volumen de 100.000 pacientes, cobertura E2E, compatibilidad total de navegadores, HTTPS o restauración de copias de seguridad. No afirmar que se cumplieron sin evidencia. Estado y método de verificación: [trazabilidad](trazabilidad.md) y [pruebas](pruebas-aceptacion.md).

La validación funcional preliminar del equipo no sustituye la etapa formal de Testing. En la entrega de Implementación se presentan el código, la gestión del proyecto y las decisiones de diseño documentadas.
