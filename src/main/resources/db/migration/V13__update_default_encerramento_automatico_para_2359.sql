UPDATE CONFIGURACAO_EMPRESA
SET horario_encerramento_automatico = TIME '23:59:00',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'flyway'
WHERE horario_encerramento_automatico = TIME '22:00:00';
