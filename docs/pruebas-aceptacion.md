# Pruebas y aceptación

Esta guía separa pruebas existentes, comprobaciones realizadas y casos que faltan. Base documental `96fc37a`. Una funcionalidad no se considera aprobada sólo por existir en código ni por haber compilado.

## Ejecutar las comprobaciones disponibles

Frontend, desde su carpeta:

```powershell
npm ci
npm run build
```

No hay runner de pruebas frontend ni lint configurado. La compilación comprueba tipos y bundle, no interacción, permisos ni persistencia.

Backend, con Java 21, Maven, Docker y una clave JWT válida de prueba:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
mvn -B test
```

Testcontainers inicia `mysql:8.4` y configura create-drop dentro del contenedor, sin requerir usar la BD operativa. Confirmar Docker disponible y no apuntar los tests manualmente a datos reales. La clase no suministra JWT propio y CI tampoco lo define: completar esa configuración de test para que la suite sea autocontenida.

## Automatización existente

Clase `backend/src/test/java/ar/com/agendamedica/TurnoAgendaIntegrationTest.java`:

| Método | Qué verifica |
|---|---|
| dobleReservaConcurrenteSoloPermiteUnTurno | Dos altas sobre una franja, un éxito y un conflicto |
| cancelarLiberaLaFranjaYRegistraEvento | Cancelación normal, liberación y evento |
| reprogramarLiberaAnteriorYOcupaNueva | Identidad, origen/destino y evento |
| noPermiteMarcarAtendidoAntesDelHorario | Rechazo de atención anticipada |
| cierreBloqueaLibresPeroConservaTurnosActivos | Cierre conserva compromisos e informa IDs |

Son llamadas a servicios, no pruebas de autorización HTTP. El test de cierre no cancela después el turno afectado y por eso no cubre el defecto de liberación dentro del cierre. No hay medición de cobertura porcentual.

## Evidencia de esta revisión

| Comprobación | Resultado y límite |
|---|---|
| Build frontend tras cambios de días y fechas | Correcto: TypeScript y Vite; cambios incluidos en 6999346/96fc37a |
| Selección múltiple y reintento | Comprobación temporal con API simulada: días, atajos, duración guardada, fallo parcial y revisión del calendario correctos; no es suite versionada ni E2E |
| Acceso real ADMIN al calendario | Login local y siete GET de semana 12–18/10 respondieron 200 al incluir profesionalId; no se modificaron datos |
| Petición incompleta | GET sin profesionalId devolvió 403; con profesionalId devolvió 200 |
| Compilación Java de auditoría inicial | Correcta para fuentes revisadas entonces; no sustituye compilar cada nueva versión |
| Cinco escenarios de integración | No ejecutados en la última tentativa: Testcontainers falló al iniciar Docker con respuesta 400 |
| Generación cerca de medianoche | Condición LocalTime reproducida de manera acotada; defecto pendiente |
| Pruebas E2E, carga, navegadores y restauración | Sin acta aprobada |

No se repitieron compilaciones ni se modificó la aplicación por la actualización documental. El resultado del CI remoto no fue consultado.

## Casos de aceptación por completar

Usar una base descartable con un profesional activo y pacientes ficticios. Las fechas deben ser futuras al ejecutar. Registrar commit, zona horaria, configuración, datos de entrada y resultado por caso.

| Caso | Procedimiento y resultado exigido |
|---|---|
| CA-01 | Arrancar desde clon limpio, crear ADMIN y consultar profesional/configuración según guía |
| CA-02 | Guardar configuración 40/90, recargar y recuperar esos valores; cambiar duración y verificar persistencia |
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
| CA-16 | En 360 px y navegadores acordados, completar reserva y navegar fechas con teclado; Hoy sólo en fecha actual |
| CA-17 | Cambiar duración: preservar turnos previos, aplicar estándar a nuevas plantillas/aperturas y analizar franjas antiguas |
| CA-18 | Dos cambios simultáneos del mismo turno no dejan destinos ocupados sin compromiso ni eventos incompatibles |

## Pruebas de carga y salida

Medir los objetivos del SRS con volumen, concurrencia, percentil y entorno registrados: agenda p95 <1 s con 20 usuarios; DNI exacto <500 ms con 100.000 pacientes; hasta 5 interacciones principales para reserva normal. No inventar resultados ni reemplazar carga por una única consulta local.

Para cerrar aceptación: ejecutar casos críticos sin defectos P1, completar matriz de roles, persistencia y restauración; registrar pendientes aceptados con responsable y fecha; obtener conformidad del responsable del consultorio. Crear actas con evidencia concreta, no sólo casillas marcadas. La [trazabilidad](trazabilidad.md) relaciona cada caso con su necesidad.
