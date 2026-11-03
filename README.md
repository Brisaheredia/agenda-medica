# Agenda Médica

Aplicación web para centralizar pacientes, disponibilidad y turnos del consultorio del Dr. Salvador Amado. Documentación de alcance y permisos actualizada el **3 de noviembre de 2026**.

El sistema permite reservar, cancelar y reprogramar turnos, consultar agenda diaria, semanal y por rango, habilitar los meses dentro del horario fijo y registrar atención o ausencia. El núcleo está implementado; la aceptación integral y los pendientes indicados abajo todavía deben cerrarse.

## Organización y lectura

La documentación vigente se versiona en este repositorio junto al código. El README general orienta la lectura; `frontend/README.md` y `backend/README.md` describen cada módulo; `docs/` reúne requisitos, manual y documentación técnica. Ejecutar los comandos desde la raíz de un clon local, salvo indicación de otra carpeta.

| Necesidad | Documento vigente |
|---|---|
| Aprender a operar el sistema | [Manual de usuario](docs/manual-usuario.md) |
| Consultar permisos y gestionar cuentas | [Roles y permisos](docs/roles-permisos.md) |
| Instalar y configurar desde cero | [Instalación](docs/instalacion-configuracion.md) |
| Trabajar en la interfaz | [README del frontend](frontend/README.md) |
| Trabajar en API y persistencia | [README del backend](backend/README.md) |
| Entender alcance y reglas | [Requisitos](docs/requisitos.md) |
| Entender componentes y dependencias | [Arquitectura](docs/arquitectura.md) |
| Entender entidades y estados | [Modelo de datos](docs/modelo-datos.md) |
| Consumir endpoints | [API](docs/api.md) |
| Verificar comportamiento | [Pruebas y aceptación](docs/pruebas-aceptacion.md) |
| Relacionar necesidad, código y evidencia | [Trazabilidad](docs/trazabilidad.md) |
| Respaldar y operar | [Operación y respaldo](docs/operacion-respaldo.md) |
| Colaborar y mantener bajo el acoplamiento | [Mantenimiento](docs/mantenimiento-contribucion.md) |
| Revisar lo que falta | [Pendientes y riesgos](docs/pendientes-riesgos.md) |
| Consultar cambios recientes | [Cambios](CHANGELOG.md) |
| Ver origen y decisiones de alcance | [Referencias](docs/referencias/README.md) |

## Alcance confirmado

Un profesional, de lunes a viernes de **08:00 a 20:00**, con **40 minutos de duración fija**. No se puede cambiar la duración desde el frontend ni la API. Los días y horarios no son editables: el consultorio habilita franjas por mes hasta el final del tercer mes futuro.

Se incluyen pacientes (con obra social opcional), disponibilidad, turnos, cancelación, reprogramación manual, cierres de atención, atención/ausencia y auditoría básica. Reprogramaciones muestra los pacientes afectados por suspensiones del consultorio con sus datos de contacto, y permite asignarles otro horario manualmente. No se incluyen historia clínica, recetas, pagos, facturación, autogestión, recordatorios automáticos ni reprogramación automática.

## Agenda compartida y actores

Recepción y Obras Sociales consultan la misma agenda. Ambos pueden buscar y registrar pacientes, asignar y cancelar turnos por solicitud del paciente; sólo Administración y Recepción editan/desactivan pacientes. Al registrar un paciente se puede elegir una obra social existente o agregar una desde el mismo formulario, sin obligatoriedad para pacientes particulares. El dato se muestra en turnos sólo cuando está cargado.

Obras Sociales no ve ni envía el motivo de consulta, no accede al directorio completo ni a los contactos privados del listado de pendientes, y **no puede resolver reprogramaciones causadas por suspensión del consultorio**. Esas reprogramaciones se hacen desde Recepción o Administración. La agenda se vuelve a consultar al regresar a la pestaña y cada 30 segundos mientras está visible: no es sincronización instantánea; el backend siempre comprueba ocupación al confirmar.

## Stack y acceso local

React, TypeScript y Vite; Spring Boot 3.5.6 con Java 21; MySQL 8; Spring Security con JWT y BCrypt; OpenAPI/Swagger. La versión declarada de ambos módulos es `0.0.1`; no se infiere una liberación productiva a partir de ese número.

| Servicio | Valor por defecto del proyecto |
|---|---|
| Frontend | Puerto inicial 5173, si está libre |
| Backend | `http://localhost:8080` |
| MySQL | Puerto 3306 |

Los puertos se pueden configurar por entorno; no son requisitos inmutables. Cada instalación define sus propias variables; las configuraciones personales no se publican ni se consideran valores generales.

Seguir [instalación](docs/instalacion-configuracion.md) para alinear los puertos, definir JWT y configurar el acceso. Con perfil `dev`, cada integrante obtiene cuatro cuentas de prueba en su propia BD, con las contraseñas iniciales documentadas en esa guía. Las claves personalizadas de una instalación no se versionan.

## Estado y límites

Existen comprobaciones anteriores de compilación y pruebas del backend, incluidas reserva y reprogramación concurrentes; **esos resultados son históricos y no certifican los parches de noviembre**. La validación visual en navegador, la aceptación integral y las pruebas de carga siguen pendientes.

Se habilitan horarios por mes con duración fija de 40 minutos, validación de intervalos y conservación de citas/historia. Se retiraron la edición del horario habitual, las aperturas extraordinarias y la migración mensual asociada. La autorización por roles está implementada; su verificación formal y la aceptación integral quedan pendientes. **No existe un modo demo activo**. Detalle y prioridades en [pendientes](docs/pendientes-riesgos.md).

El [índice de documentación](docs/README.md) reúne las guías por audiencia y los diagramas Mermaid se mantienen como texto en sus documentos.

## Control documental

Mantener esta edición junto con el código: toda modificación funcional debe revisar el manual, contrato API, requisitos y pruebas afectados. La fecha y el commit identifican la base revisada; no certifican conformidad con una norma ni sustituyen aceptación del cliente. El equipo debe designar responsables de aprobación funcional y operación.
