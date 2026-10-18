# Pruebas y aceptación

Esta guía separa pruebas existentes, comprobaciones realizadas y casos que faltan. Actualizado con colores y reprogramaciones el 17 de octubre de 2026. Una funcionalidad no se considera aprobada sólo por existir en código ni por haber compilado.

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

Pruebas unitarias sin Docker: `mvn -B "-Dtest=DisponibilidadServiceTest,AgendaConsultaServiceTest" test`.

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
| duracionFijaRechazaCambiosYPermiteGuardarSoloHorizonte | Rechaza 30 en configuración, plantilla y apertura; permite guardar sólo horizonte |
| noBorraNiModificaTurnoAntiguoCuandoImpideGenerarCuarenta | Mantiene cita antigua e intervalo original ante conflicto, sin cambios parciales |
| reservasDeCuarentaEnFranjasDiferentesSuperpuestasSeSerializan | Un éxito y un conflicto entre dos IDs con intervalos superpuestos |
| generacionMensualEsFinitaCercaDeMedianocheYNoAceptaDosMeses | Límite de medianoche y rechazo de generación de varios meses |
| usuariosPersistenCuartoRolYRevocanSesionAlCambiarCredenciales | Persiste OBRAS_SOCIALES, BCrypt, cambios de contraseña/rol, invalida JWT y protege último administrador |

Estos escenarios llaman servicios. `AutorizacionHttpTest` agrega pruebas de autorización con filtros/controladores y JWT reales para los cuatro roles, servicios simulados y sin acceso a datos del consultorio. Ver [roles y permisos](roles-permisos.md). DisponibilidadServiceTest agrega seis pruebas sobre liberación, cierre parcial y destino cerrado. AgendaConsultaServiceTest agrega tres sobre contactos, cierres duplicados, cancelación individual y rango inválido. No hay medición de cobertura porcentual.

## Evidencia de esta revisión

| Comprobación | Resultado y límite |
|---|---|
| Build frontend tras cambios de días y fechas | Correcto: TypeScript y Vite; cambios incluidos en 6999346/96fc37a |
| Selección múltiple y reintento | Comprobación temporal con API simulada: días, atajos, duración guardada, fallo parcial y revisión del calendario correctos; no es suite versionada ni E2E |
| Acceso real ADMIN al calendario | Login local y siete GET de semana 12–18/10 respondieron 200 al incluir profesionalId; no se modificaron datos |
| Petición incompleta | GET sin profesionalId devolvió 403; con profesionalId devolvió 200 |
| Compilación Java de auditoría inicial | Correcta para fuentes revisadas entonces; no sustituye compilar cada nueva versión |
| Suite actual de backend | 186/186 aprobadas: 162 HTTP, quince de integración en MySQL 8.4 descartable y nueve unitarias, sin omisiones. Reportes Surefire locales en backend/target/surefire-reports (ignorados por Git). |
| Permisos de interfaz | 5/5 pruebas de render aprobadas con `npm test`: menú, acceso directo a rutas, formularios, reserva, cancelación y resultados según cada rol; build TypeScript/Vite aprobado. Sin inspección visual en navegador. |
| Cuentas de la instalación local | Ingreso comprobado con los cuatro roles; 76 comprobaciones de permisos contra la API local, con lecturas y cuerpos inválidos/IDs inexistentes para no alterar datos operativos. Contraseñas entregadas fuera del repositorio. |
| Frontend actual | npm run build aprobado; diez comprobaciones temporales con Node sobre origen/colores y límites de cierre aprobadas; pantalla Reprogramaciones comprobada con API simulada (contactos, filtros, permiso vigente y guardado sin depender de la agenda diaria). GeneracionMensual comprobada con API simulada: mes, rango y bloqueo de doble envío; no envía duración. No son validación visual ni suite versionada. |
| Generación cerca de medianoche | Iteración reemplazada por LocalDateTime y límite; prueba mensual cerca de medianoche aprobada |
| Pruebas E2E, carga, navegadores y restauración | Sin acta aprobada |

La nueva evidencia corresponde al árbol de trabajo con colores/reprogramaciones del 17/10/2026, posterior a 8fc8bc2. Las pruebas de negocio y permisos se ejecutan con servicios simulados o datos ficticios en contenedores; la configuración de cuentas solicitada se aplica por separado a la instalación local y no modifica pacientes ni turnos. El resultado del CI remoto no fue consultado.

## Casos de aceptación por completar

Usar una base descartable con un profesional activo y pacientes ficticios. Las fechas deben ser futuras al ejecutar. Registrar commit, zona horaria, configuración, datos de entrada y resultado por caso.

| Caso | Procedimiento y resultado exigido |
|---|---|
| CA-01 | Arrancar desde clon limpio, crear ADMIN y consultar profesional/configuración según guía |
| CA-02 | Verificar duración fija 40 y horizonte 90; guardar otro horizonte, recargar y comprobar; rechazar duración 30 |
| CA-03 | Marcar lunes–viernes 08:00–20:00, guardar y habilitar una semana: 18 franjas por día sin cierres, ninguna de fin de semana |
| CA-04 | Con API simulada fallar el tercer día: conservar pendientes y reintentar sin duplicar los dos éxitos previos |
| CA-05 | Registrar paciente, buscar por DNI/apellido, editar, desactivar y verificar historial preservado |
| CA-06 | Reservar, recargar, rechazar nueva reserva concurrente sobre la misma franja con conflicto controlado |
| CA-07 | Intentar intervalos superpuestos creados por plantillas/aperturas; impedir compromiso simultáneo del profesional |
| CA-08 | Cancelar turno sin cierre: conservar historial y liberar; cancelar dentro de cierre: mantener bloqueo |
| CA-09 | Reprogramar a libre: mismo ID, origen/destino/actor; a ocupada: error y original intacto |
| CA-10 | Cerrar un día ocupado: conservar turnos, listar pacientes/contactos, recuperar pendientes tras recarga y resolver uno a uno |
| CA-11 | Atender/ausente: rechazar antes del inicio y aceptar desde inicio según rol |
| CA-12 | Verificar todas las filas de roles API, sesión vencida, credenciales incorrectas y errores 400/403 sin confundir causas |
| CA-13 | Consultar disponibilidad desde fecha elegida, varias alternativas y rango; excluir pasado/cierres/ocupación |
| CA-14 | Generar cerca de medianoche y repetir generación: terminar sin horarios fuera del intervalo ni duplicados |
| CA-15 | Restaurar respaldo en base separada y contrastar pacientes, franjas, turnos, eventos y auditoría |
| CA-19 | Verificar rojo consultorio, naranja paciente, verde disponible, azul ocupado, gris sin horarios y domingo rojizo; conservar etiquetas y distinguir cancelaciones antiguas sin origen |
| CA-16 | En 360 px y navegadores acordados, completar reserva y navegar fechas con teclado; Hoy sólo en fecha actual |
| CA-17 | Generar 40 aun con plantillas antiguas de 30; limpiar sólo libres sin historial, conservar citas previas, rechazar reservas nuevas en franjas de otra duración y repetir sin duplicar. |
| CA-18 | Dos cambios simultáneos del mismo turno no dejan destinos ocupados sin compromiso ni eventos incompatibles |

## Pruebas de carga y salida

Medir los objetivos del SRS con volumen, concurrencia, percentil y entorno registrados: agenda p95 <1 s con 20 usuarios; DNI exacto <500 ms con 100.000 pacientes; hasta 5 interacciones principales para reserva normal. No inventar resultados ni reemplazar carga por una única consulta local.

Para cerrar aceptación: ejecutar casos críticos sin defectos P1, completar matriz de roles, persistencia y restauración; registrar pendientes aceptados con responsable y fecha; obtener conformidad del responsable del consultorio. Crear actas con evidencia concreta, no sólo casillas marcadas. La [trazabilidad](trazabilidad.md) relaciona cada caso con su necesidad.
