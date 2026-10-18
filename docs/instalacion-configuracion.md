# Instalación y configuración

Esta guía permite iniciar frontend, backend y MySQL en desarrollo. Los ejemplos son para PowerShell 7. Ejecutar desde las rutas de código indicadas y adaptar los puertos al entorno. No configura un despliegue productivo.

## Requisitos

Git; Java 21; Maven 3 compatible; MySQL 8; Node compatible con `^20.19.0 || >=22.12.0`; npm. Docker es requisito adicional de los tests Testcontainers. Verificar herramientas:

```powershell
git --version
java -version
mvn -version
node --version
npm --version
```

Si Maven no está en PATH, instalar/configurar la herramienta o usar la instalación configurada en el IDE. El proyecto no contiene `mvnw` ni un Compose que deba suponerse disponible.

## Configurar MySQL y el backend

Crear la base `agenda_medica` y un usuario local con permisos sobre ella, o utilizar una base de desarrollo ya preparada. La URL incluye `createDatabaseIfNotExist=true`, lo cual sólo funciona si el usuario tiene ese permiso; crear la base explícitamente es más previsible.

Desde la raíz del clon, en una terminal nueva:

```powershell
Set-Location backend
$env:DB_URL = 'jdbc:mysql://localhost:3306/agenda_medica?createDatabaseIfNotExist=true&serverTimezone=America/Argentina/Buenos_Aires'
$env:DB_USER = 'agenda_app'
$env:DB_PASSWORD = Read-Host 'Contraseña del usuario MySQL' -MaskInput
$env:SERVER_PORT = '8080'
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:JWT_EXPIRATION_MINUTES = '480'
$env:DDL_AUTO = 'update'
$env:APP_BOOTSTRAP_ADMIN_EMAIL = 'admin@agenda.local'
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = Read-Host 'Contraseña inicial del administrador' -MaskInput
$env:SPRING_PROFILES_ACTIVE = 'dev'
mvn spring-boot:run
```

El usuario MySQL del ejemplo debe existir previamente. Elegir una contraseña administrativa suficientemente larga; la creación posterior por API exige al menos 8 caracteres y hasta 72 bytes UTF-8. La generación aleatoria de JWT sirve para preparar una sesión de desarrollo: conservar la misma clave mientras se necesiten validar tokens previos. Cambiarla invalida esos tokens. En producción usar un secreto estable administrado por el entorno, no regenerarlo en cada arranque.

| Variable | Uso y valor inicial del código |
|---|---|
| `DB_URL` | MySQL localhost:3306, base agenda_medica y zona Argentina |
| `DB_USER`, `DB_PASSWORD` | Credenciales; el código tiene root/root como valores de desarrollo |
| `SERVER_PORT` | 8080 |
| `JWT_SECRET` | Obligatoria; material de clave de al menos 32 bytes UTF-8 para HMAC |
| `JWT_EXPIRATION_MINUTES` | 480 minutos |
| `DDL_AUTO` | update; modifica esquema automáticamente en desarrollo |
| `SPRING_PROFILES_ACTIVE` | dev habilita datos de ejemplo; no usar ese seed en datos reales |
| `APP_BOOTSTRAP_ADMIN_EMAIL`, `APP_BOOTSTRAP_ADMIN_PASSWORD` | Crear el primer ADMIN cuando la tabla de usuarios está vacía |
| `VITE_API_URL` | Sólo frontend; por defecto http://localhost:8080 |

El backend no carga automáticamente un `.env` por incluirlo en su carpeta. Proveer variables de proceso, configuración de ejecución del IDE o archivos Spring explícitos. La duración y el horizonte funcionales se guardan en la tabla de configuración; no hay variables de entorno implementadas para reemplazarlos.

## Configuración por entorno

Los valores por defecto son API 8080 y MySQL 3306. Si una instalación utiliza otros puertos, ajustar DB_URL, SERVER_PORT y VITE_API_URL de forma coherente. Ningún puerto particular de un equipo es requisito del proyecto.

No se versionan `.env.local`, contraseñas ni claves JWT. Spring puede cargar archivos de configuración locales según directorio de trabajo o mediante una ubicación explícita. Si el equipo utiliza `config/` junto al módulo backend, puede indicarla desde `backend` así:

```powershell
mvn spring-boot:run '-Dspring-boot.run.arguments=--spring.config.additional-location=optional:file:../config/'
```

Ese directorio es opcional y no debe suponerse presente en un clon limpio. Revisar los valores efectivos: propiedades directas en archivos adicionales pueden reemplazar los placeholders del archivo versionado. La URL del frontend debe coincidir con el backend de ese entorno.

## Configurar el frontend

Desde la raíz del clon, en otra terminal:

```powershell
Set-Location frontend
npm ci
# Contenido de .env.local para el ejemplo estándar:
# VITE_API_URL=http://localhost:8080
# Cambiar host/puerto sólo si el backend de este entorno usa otros valores.
npm run dev
```

Crear `.env.local` con la línea correspondiente y reiniciar Vite si se modifica. Abrir su URL informada. Ingresar con el usuario creado mediante bootstrap, no con una contraseña supuesta. Si ya existían usuarios, el bootstrap no reemplaza sus credenciales. Administración puede crear las otras cuentas y restablecer contraseñas desde **Usuarios**; no hay contraseñas universales para los cuatro roles. Ver [roles y permisos](roles-permisos.md).

## Duración fija

Esta versión no requiere la migración mensual propuesta para cambios de duración: ese circuito fue retirado. Reiniciar el backend actualizado. Los horarios nuevos siempre duran 40 minutos y las citas anteriores se conservan. La estructura de origen de cancelación se mantiene como parte del circuito de suspensiones; con DDL manual revisar su SQL específico.

## Comprobación inicial

1. Swagger abre y el frontend muestra el login.
2. Login devuelve rol y sesión válida; aparece el primer profesional activo.
3. ADMIN consulta y guarda configuración; se vuelve a leer el valor guardado.
4. Se cargan días/horario y se habilitan fechas según el [manual](manual-usuario.md).
5. Se reserva un turno de prueba, se recarga y se comprueba persistencia.

El perfil dev ayuda a disponer de un profesional, pero crea franjas de ejemplo de 30 minutos; no sustituye la configuración del consultorio. Sin dev, la provisión del profesional debe realizarla soporte sobre la BD o una futura herramienta administrativa: actualmente no hay endpoint de alta de profesional.

## Diagnóstico

| Síntoma | Comprobar |
|---|---|
| Maven no reconocido | PATH o Maven del IDE |
| Falla al construir JWT | Variable presente, longitud suficiente y configuración cargada |
| MySQL no conecta | Servicio, puerto efectivo (3306 por defecto), usuario y permisos |
| Frontend sin conexión | VITE_API_URL, puerto real, backend activo y reinicio de Vite |
| Login falla tras cambiar bootstrap | El usuario ya existía; bootstrap no cambia su clave |
| Falta profesional activo | Seed dev o provisión administrativa |
| Calendario sin horarios | Profesional correcto, rango consultado, generación y filtros |
| 403 inesperado | Rol y token; también revisar parámetros faltantes y logs del backend |

No se garantiza arranque desde un clon limpio hasta completar las pruebas de aceptación y provisión señaladas en [pendientes](pendientes-riesgos.md).
