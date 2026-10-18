# Roles y permisos

Matriz solicitada para los cuatro roles. La autorización se aplica en `SecurityConfig` antes de ejecutar los controladores; el frontend usa `src/permisos.ts` para mostrar las acciones correspondientes. Modificar React, localStorage o el claim de rol de un token no concede permisos.

| Operación | ADMIN | MEDICO | RECEPCION | OBRAS_SOCIALES |
|---|---|---|---|---|
| Consultar agenda y disponibilidad | Sí | Sí | Sí | Sí |
| Registrar, editar o desactivar pacientes | Sí | No | Sí | No |
| Asignar, cancelar y reprogramar turnos | Sí | No | Sí | Sí |
| Modificar horarios, generar franjas y crear aperturas | Sí | Sí | No | No |
| Bloquear días o períodos de atención | Sí | Sí | No | No |
| Registrar atendido o ausente | Sí | Sí | Sí | No |
| Gestionar usuarios, roles y contraseñas | Sí | No | No | No |
| Configurar anticipación máxima | Sí | No | No | No |
| Consultar auditoría | Sí | No | No | No |
| Consultar pacientes y contactos para reprogramación | Sí | Sí | Sí | No |

Obras sociales busca pacientes existentes por DNI completo o al menos tres caracteres del apellido en `/api/pacientes/seleccion`. Recibe ID, DNI, nombre, apellido y estado activo. No accede a teléfono, email, directorio completo ni motivos de consulta/cancelación de los turnos. Puede reprogramar desde la agenda. Sólo puede cancelar por solicitud del paciente; suspender atención del consultorio no corresponde a ese rol. Administración y Recepción conservan la cancelación individual por decisión del consultorio, para coordinar las reprogramaciones.

## Administración de cuentas

En **Usuarios**, Administración puede crear una cuenta indicando email, rol y contraseña, cambiar su rol, activar/desactivar su acceso y restablecer su contraseña. El sistema impide desactivar o quitar el rol al último administrador activo. El restablecimiento solicita una contraseña nueva; nunca permite consultar la anterior. No hay recuperación por email ni cambio de contraseña autónomo para otros roles.

Las contraseñas se guardan con BCrypt. Las claves personalizadas de una instalación se entregan por separado y no se versionan. Para desarrollo en máquinas independientes, el perfil `dev` prepara automáticamente cuatro [cuentas de prueba documentadas](instalacion-configuracion.md#cuentas-de-prueba-para-cada-integrante), una por rol, en la BD de cada integrante. Fuera de dev, crear el primer administrador con las variables de bootstrap y luego las otras cuentas desde **Usuarios**. Los usuarios existentes se mantienen al reiniciar; ningún seed restablece sus contraseñas, roles ni estados.

El filtro vuelve a consultar el usuario activo y sus autoridades en BD en cada petición. El token incluye una huella de la credencial: cambiar la contraseña o el rol invalida las sesiones anteriores. Desactivar una cuenta también impide usar sus tokens. Después de estos cambios, volver a iniciar sesión; si Administración modifica su propia cuenta, la interfaz cierra su sesión.

La API responde 401 ante ausencia de sesión, firma inválida, cuenta inactiva o token anterior a un cambio de credenciales/rol; responde 403 a una operación que el rol autenticado no puede ejecutar. Las rutas nuevas quedan denegadas hasta agregarlas explícitamente a la política.

## Verificación

`AutorizacionHttpTest` prueba los controladores y filtros reales con JWT y servicios de negocio simulados: matriz de los cuatro roles, anonimato, firma y rol alterados, revocación y datos mínimos. `TurnoAgendaIntegrationTest` verifica persistencia del cuarto rol, BCrypt, cambios de contraseña/rol, login y protección del último administrador en MySQL descartable. `npm test` comprueba menús, rutas y botones por rol con render de React; no sustituye una prueba visual en navegador.
