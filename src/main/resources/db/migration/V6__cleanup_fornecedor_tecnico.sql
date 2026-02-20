-- Limpeza de homologacao: elimina o fornecedor tecnico legado quando possivel.
-- Se houver promotores vinculados a ele e existir fornecedor "real",
-- move os promotores para o primeiro fornecedor real antes de excluir.

UPDATE PROMOTOR p
SET fornecedor_id = (
    SELECT f.id
    FROM FORNECEDOR f
    WHERE LOWER(f.nome) <> 'fornecedor nao informado'
    ORDER BY f.codigo NULLS LAST, f.id
    FETCH FIRST 1 ROW ONLY
)
WHERE p.fornecedor_id = (
    SELECT ft.id FROM FORNECEDOR ft WHERE LOWER(ft.nome) = 'fornecedor nao informado'
)
AND EXISTS (
    SELECT 1 FROM FORNECEDOR f2 WHERE LOWER(f2.nome) <> 'fornecedor nao informado'
);

DELETE FROM FORNECEDOR
WHERE LOWER(nome) = 'fornecedor nao informado'
AND NOT EXISTS (
    SELECT 1
    FROM PROMOTOR p
    WHERE p.fornecedor_id = FORNECEDOR.id
);

-- Reorganiza codigo para manter sequencia visual sem lacunas.
UPDATE FORNECEDOR
SET codigo = (
    SELECT ranked.codigo
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS codigo
        FROM FORNECEDOR
    ) ranked
    WHERE ranked.id = FORNECEDOR.id
);
