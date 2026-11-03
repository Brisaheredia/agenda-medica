# Roles y permisos

Matriz implementada para los cuatro roles (decisión del equipo, no todos los permisos fueron solicitados textualmente por Salvador). La autorización se aplica en `SecurityConfig` antes de ejecutar los controladores; el frontend usa `src/permisos.ts` para mostrar las acciones correspondientes. Modificar React, localStorage o el claim de rol de un token no concede permisos.

| Operación | ADMIN | MEDICO | RECEPCION | OBRAS_SOCIALES |
|---|---|---|---|---|
| Consultar agenda y disponibilidad | Sí | Sí | Sí | Sí |
| Registrar pacientes nuevos | Sí | No | Sí | Sí, desde Asignar turno |
| Editar o desactivar pacientes | Sí | No | Sí | No |
| Consultar catálogo de obras sociales | Sí | Sí | Sí | Sí |
| Agregar una obra social desde el formulario | Sí | No | Sí | Sí |
| Asignar y cancelar turnos por solicitud del paciente | Sí | No | Sí | Sí |
| Reprogramar turnos activos sin suspensión | Sí | No | Sí | Sí |
| Recuperar turnos cancelados por el consultorio o afectados por cierres | Sí | No | Sí | No |
| Habilitar horarios del mes (horario fijo) | Sí | Sí | No | No |
| Bloquear días o períodos de atención | Sí | Sí | No | No |
| Registrar atendido o ausente | Sí | Sí | Sí | No |
| Gestionar usuarios, roles y contraseñas | Sí | No | No | No |
| Cambiar anticipación o horario habitual | No | No | No | No |
| Consultar auditoría | Sí | No | No | No |
| Consultar pacientes y contactos para reprogramación | Sí | Sí | Sí | No |

Obras Sociales busca pacientes existentes con `/api/pacientes/seleccion` (DNI o búsqueda de al menos tres caracteres) y recibe ID, DNI, nombre, apellido, estado activo y obra social, si existe. No ve el directorio completo, teléfono ni email de los resultados de búsqueda ni motivos de consulta/cancelación de los turnos. Puede **registrar un paciente nuevo** desde Agenda → Asignar turno y elegir o crear una obra social. No puede editar ni desactivar pacientes existentes. Puede reprogramar turnos activos **no afectados por cierres**, pero no recuperar cancelaciones CONSULTORIO ni turnos activos dentro de jornadas suspendidas. Sólo puede cancelar con origen PACIENTE; no puede suspender atención. Recepción y Administración gestionan las recuperaciones por suspensión.

## Administración de cuentas

En **Usuarios**, Administración puede crear una cuenta indicando email, rol y contraseña, cambiar su rol, activar/desactivar su acceso y restablecer su contraseña. El sistema impide desactivar o quitar el rol al último administrador activo. El restablecimiento solicita una contraseña nueva; nunca permite consultar la anterior. No hay recuperación por email ni cambio de contraseña autónomo para otros roles.

Las contraseñas se guardan con BCrypt. Las claves personalizadas de una instalación se entregan por separado y no se versionan. Para desarrollo en máquinas independientes, el perfil `dev` prepara automáticamente cuatro [cuentas de prueba documentadas](instalacion-configuracion.md#cuentas-de-prueba-para-cada-integrante), una por rol, en la BD de cada integrante. Fuera de dev, crear el primer administrador con las variables de bootstrap y luego las otras cuentas desde **Usuarios**. Los usuarios existentes se mantienen al reiniciar; ningún seed restablece sus contraseñas, roles ni estados.

El filtro vuelve a consultar el usuario activo y sus autoridades en BD en cada petición. El token incluye una huella de la credencial: cambiar la contraseña o el rol invalida las sesiones anteriores. Desactivar una cuenta también impide usar sus tokens. Después de estos cambios, volver a iniciar sesión; si Administración modifica su propia cuenta, la interfaz cierra su sesión.

La API responde 401 ante ausencia de sesión, firma inválida, cuenta inactiva o token anterior a un cambio de credenciales/rol; responde 403 a una operación que el rol autenticado no puede ejecutar. Las rutas nuevas quedan denegadas hasta agregarlas explícitamente a la política.

## Verificación

`AutorizacionHttpTest` prueba los controladores y filtros reales con JWT y servicios de negocio simulados: matriz de los cuatro roles, anonimato, firma y rol alterados, revocación y datos mínimos. `TurnoAgendaIntegrationTest` verifica persistencia del cuarto rol, BCrypt, cambios de contraseña/rol, login y protección del último administrador en MySQL descartable. `npm test` comprueba menús, rutas y botones por rol con render de React; no sustituye una prueba visual en navegador.

## Motivos y privacidad en la interfaz

El **motivo de consulta** es un campo opcional que pueden usar Administración y Recepción al asignar. Obras Sociales no ve ese campo y, aunque lo envíe directamente a la API, el controlador lo descarta. Para ese rol el `TurnoResponse` tampoco devuelve motivos de consulta/cancelación; sí puede mostrar `obraSocialNombre`. Cuando no hay motivo de consulta, la agenda no imprime «Sin motivo informado». Los motivos de cancelación y reprogramación son conceptos diferentes y se rigen por sus propios formularios.
