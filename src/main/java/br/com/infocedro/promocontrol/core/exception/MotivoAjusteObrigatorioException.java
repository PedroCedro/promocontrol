package br.com.infocedro.promocontrol.core.exception;

public class MotivoAjusteObrigatorioException extends BadRequestBusinessException {

    public MotivoAjusteObrigatorioException() {
        super("Motivo do ajuste obrigatorio");
    }
}
