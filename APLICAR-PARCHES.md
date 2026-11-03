# Cómo aplicar los parches — TPI Agenda Médica

Se elaboraron sobre el ZIP `agenda-medica-main (1).zip` (código del 29/10/2026).

## Opción A: parche exacto sobre tu repositorio

1. Guardá tus cambios actuales (`git status`) y hacé un commit o respaldo.
2. Copiá el archivo `agenda-medica-ajustes-tpi.patch` en la carpeta raíz del repositorio, donde están `backend/` y `frontend/`.
3. Abrí PowerShell en esa carpeta:

```powershell
git apply --check .\agenda-medica-ajustes-tpi.patch
git apply .\agenda-medica-ajustes-tpi.patch
```

Si el primer comando informa conflictos, **no ejecutes el segundo**: tu rama es distinta de la versión del ZIP. En ese caso usá los archivos del ZIP parcheado para comparar y traer sólo los cambios correspondientes.

## Opción B: carpeta completa corregida

El archivo `agenda-medica-ajustada-tpi.zip` contiene el proyecto ya modificado. **No sobrescribas ciegamente un repositorio con trabajo posterior al 29/10.** Compará o trasladá los cambios.

## Base de datos

Hacé respaldo. La configuración local ya utiliza `spring.jpa.hibernate.ddl-auto=update`: al reiniciar, Hibernate debería agregar la entidad `obras_sociales` y la columna opcional del paciente. **Si usás `DDL_AUTO=update`, no ejecutes adicionalmente el SQL manual.** Si usás `validate` o `none`, ejecutá **una sola vez** el script `backend/sql/2026-11-02-obras-sociales.sql` antes de iniciar el backend.

## Pruebas

Desde `backend/`, con Java 21, Maven y Docker:

```powershell
mvn test "-Dtest=AutorizacionHttpTest,TurnoServicePermisosTest"
mvn test "-Dtest=TurnoAgendaIntegrationTest"
```

Desde `frontend/`:

```powershell
npm ci
npm run build
npm test
```

Después seguí el archivo `VERIFICACION-PARCHES-TPI.md` para las comprobaciones en dos sesiones independientes.

**Importante:** las pruebas completas no se ejecutaron en el entorno de preparación; el frontend se revisó sintácticamente, no se compiló. Verificar primero en una base local de prueba.

## Documentación del alcance final

Después de los parches funcionales, aplicar también el parche documental `agenda-medica-documentacion-tpi.patch`, preparado sobre los Markdown existentes. Comprobar antes con `git apply --check` y no volver a aplicar los parches funcionales que ya figuran como cambios en `git status`. El equipo todavía no necesita hacer commit por separado: puede revisar todo y confirmar una sola vez.
