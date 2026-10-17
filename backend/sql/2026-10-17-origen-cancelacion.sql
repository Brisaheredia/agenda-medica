-- MySQL 8. Aplicar una sola vez sobre el esquema correcto, con respaldo previo.
-- Sólo si las columnas todavía no existen: ddl-auto=update puede haberlas creado.
-- No se deduce el origen de cancelaciones históricas: permanece NULL.
ALTER TABLE turnos
    ADD COLUMN origen_cancelacion VARCHAR(20) NULL,
    ADD COLUMN motivo_cancelacion VARCHAR(500) NULL;
