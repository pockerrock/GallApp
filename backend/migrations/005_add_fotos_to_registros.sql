-- Add foto_factura and foto_medidor columns to registros_diarios table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_diarios' AND column_name = 'foto_factura') THEN
        ALTER TABLE registros_diarios ADD COLUMN foto_factura VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registros_diarios' AND column_name = 'foto_medidor') THEN
        ALTER TABLE registros_diarios ADD COLUMN foto_medidor VARCHAR(255);
    END IF;
END
$$;
