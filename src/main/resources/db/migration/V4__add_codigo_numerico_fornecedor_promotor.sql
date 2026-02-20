ALTER TABLE FORNECEDOR ADD COLUMN codigo INTEGER;
ALTER TABLE PROMOTOR ADD COLUMN codigo INTEGER;

UPDATE FORNECEDOR
SET codigo = (
    SELECT ranked.codigo
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS codigo
        FROM FORNECEDOR
    ) ranked
    WHERE ranked.id = FORNECEDOR.id
);

UPDATE PROMOTOR
SET codigo = (
    SELECT ranked.codigo
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS codigo
        FROM PROMOTOR
    ) ranked
    WHERE ranked.id = PROMOTOR.id
);

ALTER TABLE FORNECEDOR ADD CONSTRAINT uk_fornecedor_codigo UNIQUE (codigo);
ALTER TABLE PROMOTOR ADD CONSTRAINT uk_promotor_codigo UNIQUE (codigo);
