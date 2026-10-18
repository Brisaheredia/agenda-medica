-- MySQL 8. Aplicar sobre el esquema correcto, con respaldo previo.
-- Ejecutar ALTER sólo si la columna no existe: ddl-auto=update puede crearla.
ALTER TABLE turnos
    ADD COLUMN reprogramado_por_consultorio BOOLEAN NOT NULL DEFAULT FALSE;

-- Este UPDATE se puede ejecutar también si Hibernate ya creó la columna.
-- Recupera únicamente cancelaciones CONSULTORIO explícitas seguidas por una reprogramación.
-- No se deduce la causa de movimientos antiguos a partir del texto libre ingresado por el usuario.
UPDATE turnos t
SET t.reprogramado_por_consultorio = TRUE
WHERE t.reprogramado_por_consultorio = FALSE
  AND EXISTS (
      SELECT 1 FROM turno_eventos c
      JOIN turno_eventos r ON r.turno_id = c.turno_id AND r.id > c.id
      WHERE c.turno_id = t.id
        AND c.tipo = 'CANCELACION'
        AND c.detalle LIKE 'Cancelación CONSULTORIO:%'
        AND r.tipo = 'REPROGRAMACION'
  );
