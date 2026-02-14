CREATE TABLE PROMOTOR (
    id UUID NOT NULL,
    version BIGINT,
    nome VARCHAR(255),
    telefone VARCHAR(255),
    empresa_id INTEGER,
    status VARCHAR(255),
    foto_path VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(120) NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    CONSTRAINT pk_promotor PRIMARY KEY (id)
);

CREATE TABLE MOVIMENTO_PROMOTOR (
    id UUID NOT NULL,
    promotor_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    responsavel VARCHAR(120),
    observacao VARCHAR(255),
    data_hora_original TIMESTAMP,
    ajustado_por VARCHAR(120),
    ajustado_em TIMESTAMP,
    ajuste_motivo VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(120) NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    CONSTRAINT pk_movimento_promotor PRIMARY KEY (id),
    CONSTRAINT fk_movimento_promotor_promotor FOREIGN KEY (promotor_id) REFERENCES PROMOTOR (id)
);
