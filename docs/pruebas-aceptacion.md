# Pruebas y aceptación

Esta guía separa pruebas existentes, comprobaciones realizadas y casos pendientes. Revisión de alcance: 29 de octubre de 2026. **Los resultados enumerados más abajo son históricos y no prueban el commit actual.** Se actualizaron referencias puntuales de pruebas existentes a los métodos y rutas vigentes. **No se ejecutó ni aprobó la suite** sobre el cambio actual; su evaluación completa y ampliación corresponde a la entrega formal de Testing. No se ejecutó una suite integral nueva para estos cambios.

## Ejecutar las comprobaciones disponibles

Frontend, desde su carpeta:

```powershell
npm ci
npm test
npm run build
```

`npm test` usa Node, Vite y render de React para verificar menús, rutas y botones por rol; no hay lint configurado. La compilación comprueba tipos y bundle, no interacción, permisos ni persistencia.

Backend, con Java 21, Maven y Docker:

```powershell
mvn -B test
```

Testcontainers inicia `mysql:8.4` y configura create-drop dentro del contenedor, sin requerir usar la BD operativa. Confirmar Docker disponible y no apuntar los tests manualmente a datos reales. La clase suministra una clave JWT exclusiva de test. En el Docker 29 de esta máquina fue necesario `mvn -B -Dapi.version=1.44 test` para compatibilidad con el cliente de Testcontainers; no cambia los puertos del sistema. La ejecución local también necesitó acceso al almacén de certificados de Windows para resolver dependencias de Maven. Estas opciones son del entorno, no requisitos de producción.

Pruebas unitarias sin Docker: `mvn -B "-Dtest=DisponibilidadServiceTest,AgendaConsultaServiceTest,TiempoAgendaTest,DevUsuariosSeederTest" test`.

## Automatización existente

Clase `backend/src/test/java/ar/com/agendamedica/TurnoAgendaIntegrationTest.java`:

| Método | Qué verifica |
|---|---|
| dobleReservaConcurrenteSoloPermiteUnTurno | Dos altas sobre una franja, un éxito y un conflicto |
| cancelarLiberaLaFranjaYRegistraEvento | Cancelación normal, liberación y evento |
| reprogramarLiberaAnteriorYOcupaNueva | Identidad, origen/destino y evento |
| noPermiteMarcarAtendidoAntesDelHorario | Rechazo de atención anticipada |
| cierreBloqueaLibresPeroConservaTurnosActivos | Recupera contacto tras cierre y resuelve moviendo el turno sin reabrir origen |
| cancelacionDelConsultorioConservaContactoYPermiteReprogramar | Persiste origen, recupera pendiente y conserva identidad/eventos al resolver |
| pacienteQueCancelaEnDiaSuspendidoNoEntraEnPendientesNiReabreHorario | Excluye paciente cancelado, mantiene cierre y no ofrece ese horario |
| noReprogramaCancelacionSolicitadaPorPaciente | Rechaza reactivación y conserva destino libre |
| dosReprogramacionesConcurrentesDelMismoTurnoNoDejanFranjasHuerfanas | Serializa cambios del mismo turno y deja sólo su destino final ocupado |
| generaCuarentaAunqueLaPlantillaSeaAntiguaYLimpiaSoloLibresSinHistoria | Genera 18 horarios de 40, limpia legado libre sin historial y repite sin duplicar |
| duracionFijaRechazaCambiosYPermiteGuardarSoloHorizonte | **Obsoleto**: invoca configuración/plantillas/aperturas retiradas; adaptar a horario fijo. |
| noBorraNiModificaTurnoAntiguoCuandoImpideGenerarCuarenta | Mantiene cita antigua e intervalo original ante conflicto, sin cambios parciales |
| reservasDeCuarentaEnFranjasDiferentesSuperpuestasSeSerializan | Un éxito y un conflicto entre dos IDs con intervalos superpuestos |
| generacionMensualEsFinitaCercaDeMedianocheYNoAceptaDosMeses | **Obsoleto en parte**: el ejemplo usa horas 23:00 y plantillas editables. Conservar la verificación de un solo mes y el límite temporal, adaptando a 08:00–20:00. |
| usuariosPersistenCuartoRolYRevocanSesionAlCambiarCredenciales | Persiste OBRAS_SOCIALES, BCrypt, cambios de contraseña/rol, invalida JWT y protege último administrador |

Estos escenarios llaman servicios. `AutorizacionHttpTest` agrega pruebas de autorización con filtros/controladores y JWT reales para los cuatro roles, servicios simulados y sin acceso a datos del consultorio. Ver [roles y permisos](roles-permisos.md). DisponibilidadServiceTest agrega seis pruebas sobre liberación, cierre parcial y destino cerrado. AgendaConsultaServiceTest agrega tres sobre contactos, cierres duplicados, cancelación individual y rango inválido. No hay medición de cobertura porcentual.

`DevUsuariosSeederTest` verifica creación de los cuatro roles, conservación de cuentas existentes, reinicios sin duplicados, validación previa a inserciones, activación exclusiva en `dev`, deshabilitación y variables de configuración. `DevUsuariosIntegrationTest` arranca la aplicación con una BD MySQL nueva descartable y comprueba inicio de sesión con las cuatro cuentas y repetición de la inicialización sin cambiar hashes.

## Evidencia de esta revisión

| Comprobación | Resultado y límite |
|---|---|
| Build frontend tras cambios de días y fechas | Correcto: TypeScript y Vite; cambios incluidos en 6999346/96fc37a |
| Selección múltiple y reintento | Comprobación temporal con API simulada: días, atajos, duración guardada, fallo parcial y revisión del calendario correctos; no es suite versionada ni E2E |
| Acceso real ADMIN al calendario | Login local y siete GET de semana 12–18/10 respondieron 200 al incluir profesionalId; no se modificaron datos |
| Petición incompleta | GET sin profesionalId devolvió 403; con profesionalId devolvió 200 |
| Compilación Java de auditoría inicial | Correcta para fuentes revisadas entonces; no sustituye compilar cada nueva versión |
| Suite actual de backend | 197/197 aprobadas: 162 HTTP, diecisiete de integración en MySQL 8.4 descartable, nueve unitarias de agenda, tres de zona horaria y seis de inicialización de cuentas, sin omisiones. Reportes Surefire locales en backend/target/surefire-reports (ignorados por Git). |
| Interfaz | 15/15 pruebas aprobadas con `npm test`, tanto con TZ=UTC como TZ=Asia/Tokyo: acciones por rol, ocultamiento de franjas vacías, medianoche en Buenos Aires, interpretación de horarios, selectores en español, límite mensual, procedencia de reprogramación y nueva distribución de Disponibilidad y contador de pendientes (con y sin aviso). Build TypeScript/Vite aprobado. Sin inspección visual en navegador. |
| Cuentas de la instalación local | Ingreso comprobado con los cuatro roles; 76 comprobaciones de permisos contra la API local, con lecturas y cuerpos inválidos/IDs inexistentes para no alterar datos operativos. Contraseñas entregadas fuera del repositorio. |
| Frontend actual | npm run build aprobado; diez comprobaciones temporales con Node sobre origen/colores y límites de cierre aprobadas; pantalla Reprogramaciones comprobada con API simulada (contactos, filtros, permiso vigente y guardado sin depender de la agenda diaria). GeneracionMensual comprobada con API simulada: mes, rango y bloqueo de doble envío; no envía duración. No son validación visual ni suite versionada. |
| Generación cerca de medianoche | Iteración reemplazada por LocalDateTime y límite; prueba mensual cerca de medianoche aprobada |
| Pruebas E2E, carga, navegadores y restauración | Sin acta aprobada |

La evidencia anterior corresponde a revisiones anteriores del 17/10/2026, no al árbol actual tras los retiros y refactorizaciones. Las pruebas de negocio y permisos se ejecutan con servicios simulados o datos ficticios en contenedores; la configuración de cuentas solicitada se aplica por separado a la instalación local y no modifica pacientes ni turnos. El resultado del CI remoto no fue consultado.

## Casos de aceptación por completar

Usar una base descartable con un profesional activo y pacientes ficticios. Las fechas deben ser futuras al ejecutar. Registrar commit, zona horaria, configuración, datos de entrada y resultado por caso.

| Caso | Procedimiento y resultado exigido |
|---|---|
| CA-01 | Arrancar desde clon limpio, crear ADMIN y consultar profesional/configuración según guía |
| CA-02 | Verificar regla fija lunes a viernes, 08:00–20:00, duración 40; sin edición de horario ni anticipación en días. |
| CA-03 | Habilitar un mes con horario fijo: 18 franjas por día hábil, ninguna de fin de semana; repetir sin duplicar. |
| CA-04 | Habilitar mes actual y cada uno de los tres meses siguientes completos; el cuarto mes futuro queda fuera de selección. |
| CA-05 | Registrar paciente, buscar por DNI/apellido, editar, desactivar y verificar historial preservado |
| CA-06 | Reservar, recargar, rechazar nueva reserva concurrente sobre la misma franja con conflicto controlado |
| CA-07 | Intentar reservar dos franjas superpuestas o una franja antigua fuera del horario fijo: rechazar la reserva indebida. |
| CA-08 | Cancelar turno sin cierre: conservar historial y liberar; cancelar dentro de cierre: mantener bloqueo |
| CA-09 | Reprogramar a libre: mismo ID, origen/destino/actor; a ocupada: error y original intacto |
| CA-10 | Previsualizar turnos afectados antes de confirmar cierre; conservar turnos, listar contactos, recuperar pendientes tras recarga y resolver uno a uno. |
| CA-10B | Intentar previsualizar y confirmar una suspensión en sábado o domingo: rechazo 400, sin cierre registrado. El selector de fecha no ofrece esos días como seleccionables. |
| CA-11 | Atender/ausente: rechazar antes del inicio y aceptar desde inicio según rol |
| CA-12 | Verificar todas las filas de roles API, sesión vencida, credenciales incorrectas y errores 400/403 sin confundir causas |
| CA-13 | Consultar disponibilidad desde fecha elegida, varias alternativas y rango; excluir pasado/cierres/ocupación |
| CA-14 | Generar cerca de medianoche y repetir generación: terminar sin horarios fuera del intervalo ni duplicados |
| CA-15 | Restaurar respaldo en base separada y contrastar pacientes, franjas, turnos, eventos y auditoría |
| CA-19 | Verificar rojo consultorio, naranja paciente, verde disponible, azul ocupado, gris sin horarios y domingo rojizo; conservar etiquetas y distinguir cancelaciones antiguas sin origen |
| CA-16 | En 360 px y navegadores acordados, completar reserva y navegar fechas con teclado; Hoy sólo en fecha actual |
| CA-17 | Generar 40 con datos antiguos incompatibles; preservar citas/historial y no ofrecer franjas fuera del horario habitual. |
| CA-18 | Dos cambios simultáneos del mismo turno no dejan destinos ocupados sin compromiso ni eventos incompatibles |

## Pruebas de carga y salida

Medir los objetivos del SRS con volumen, concurrencia, percentil y entorno registrados: agenda p95 <1 s con 20 usuarios; DNI exacto <500 ms con 100.000 pacientes; hasta 5 interacciones principales para reserva normal. No inventar resultados ni reemplazar carga por una única consulta local.

Para cerrar aceptación: ejecutar casos críticos sin defectos P1, completar matriz de roles, persistencia y restauración; registrar pendientes aceptados con responsable y fecha; obtener conformidad del responsable del consultorio. Crear actas con evidencia concreta, no sólo casillas marcadas. La [trazabilidad](trazabilidad.md) relaciona cada caso con su necesidad.

La prueba de recuperación de marca histórica valida el SQL contra una cancelación explícita del consultorio y un cambio voluntario, marcando únicamente el primer caso. También se verifica persistencia de la marca al volver a consultar, tras un cierre y en movimientos posteriores. La base local queda con anticipación 45 y la columna de procedencia preparada; la API debe reiniciarse para exponer el nuevo campo.
