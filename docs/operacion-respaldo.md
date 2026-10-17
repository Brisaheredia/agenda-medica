# Operación, respaldo y despliegue

Procedimiento propuesto para el responsable técnico. Los comandos de respaldo/restauración no fueron ejecutados como parte de la documentación; una prueba de recuperación sigue pendiente. No representan un respaldo ya disponible ni un despliegue aprobado.

## Operación diaria y responsabilidades

Administración verifica días habilitados, duración y cierres; recepción mantiene contactos y compromisos; soporte mantiene servicios, configuración, respaldos y recuperación. El equipo debe asignar personas concretas y reemplazos antes de usar datos reales.

Al comenzar la jornada, comprobar acceso, profesional activo y agenda. Al suspender atención, conservar compromisos y coordinar reprogramación. Falta completar la bandeja de afectados; no considerar que los IDs actuales constituyen un circuito resuelto.

Ante un incidente, registrar hora/zona, commit, pantalla, operación, ID técnico del recurso y error. No incluir contraseñas, JWT, datos clínicos ni listados completos de pacientes en tickets o logs. Evitar cambios manuales de estados sin análisis y respaldo.

## Respaldo MySQL

Requiere herramientas cliente MySQL y credenciales autorizadas para respaldar. Definir frecuencia, retención y ubicación con el consultorio. Como propuesta inicial: respaldo diario y antes de cada cambio de esquema; conservar copias protegidas fuera del equipo y probar restauración periódicamente. La retención y los objetivos de recuperación deben acordarse, no se consideran establecidos.

Ejemplo de PowerShell con MySQL 3306 por defecto; reemplazar usuario y ajustar $mysqlPort al entorno de destino. No escribir la contraseña en el comando:

```powershell
$mysqlPort = 3306
$backupFolder = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'respaldos-agenda'
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
$backupFile = Join-Path $backupFolder ('agenda_medica-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.sql')
mysqldump.exe --host=127.0.0.1 --port=$mysqlPort --user=USUARIO_RESPALDO -p --single-transaction --routines --triggers --events --result-file="$backupFile" agenda_medica
if ($LASTEXITCODE -ne 0) { throw 'El respaldo no terminó correctamente.' }
Get-Item -LiteralPath $backupFile
Get-FileHash -LiteralPath $backupFile -Algorithm SHA256
```

El ejemplo usa 3306, valor por defecto de MySQL. Antes de ejecutar, comprobar el puerto real de la base de origen o destino; no copiar configuraciones personales de otro equipo. El usuario necesita los permisos apropiados para las opciones elegidas. `--single-transaction` requiere tablas transaccionales para consistencia y no protege de cambios DDL concurrentes: no ejecutar cambios de esquema durante el respaldo. Un archivo no vacío y su hash no demuestran recuperabilidad; es necesaria la restauración.

## Restauración de prueba

Utilizar una instancia o base separada, nunca sobrescribir la operativa como ensayo. El ejemplo de dump anterior no incluye `--databases`; comprobar que el archivo a restaurar no contenga USE/CREATE DATABASE que apunten a la operativa antes de usar otro nombre.

```powershell
$mysqlPort = 3306
mysql.exe --host=127.0.0.1 --port=$mysqlPort --user=USUARIO_RESTAURACION -p --execute="CREATE DATABASE agenda_medica_restauracion CHARACTER SET utf8mb4;"
# Elegir expresamente un archivo de respaldo ya verificado:
$restoreFile = 'RUTA_DEL_RESPALDO_DE_PRUEBA.sql'
mysql.exe --host=127.0.0.1 --port=$mysqlPort --user=USUARIO_RESTAURACION -p --database=agenda_medica_restauracion --execute="source $restoreFile"
if ($LASTEXITCODE -ne 0) { throw 'La restauración falló.' }
```

Si la base de prueba ya existe, no borrarla automáticamente: seleccionar otra o revisar su contenido. Apuntar una instancia de backend de prueba a la restauración, con seed dev deshabilitado y sin `create-drop`. Comparar conteos, relaciones, configuración, usuarios y muestra de compromisos/eventos; probar login y lectura sin generar datos operativos. Registrar archivo/hash, fecha, duración, destino y resultado. No se presenta esa verificación como realizada.

## Preparación de despliegue

1. Resolver los defectos críticos listados en [pendientes](pendientes-riesgos.md) y ejecutar aceptación.
2. Crear configuración separada: cuenta MySQL de aplicación, clave JWT estable externa, sin seed dev ni credenciales compartidas.
3. Incorporar migraciones y estrategia de reversión; no confiar en update automático como gestión de versiones de BD.
4. Configurar HTTPS y restringir CORS. El código actual permite cualquier origen sin limitarlo al perfil dev: requiere cambio explícito.
5. Construir frontend con VITE_API_URL del entorno; es una variable de compilación, cambiarla requiere rebuild. Servir dist con fallback de rutas SPA.
6. Empaquetar backend con pruebas aprobadas; configurar servicio, zona horaria, logs, reinicio y supervisión.
7. Verificar respaldo/restauración, accesos mínimos y prueba posterior a publicación.

No hay endpoint de health/Actuator ni despliegue automatizado documentado en el código actual. Elegir monitoreo y operación acordes al entorno. Nunca tratar `vite preview` o `spring-boot:run` como la arquitectura productiva definitiva.

## Recuperación y cambio

Antes de una actualización registrar versión y respaldo. Si falla, detener nuevas escrituras, evaluar si hubo cambio de datos/esquema y aplicar el plan específico de reversión. Revertir sólo binarios no revierte la BD. Avisar a operadores qué compromisos podrían haberse registrado durante el incidente; no recomponerlos mediante supuestos.
