package br.com.infocedro.promocontrol.core.exception;

public class LiberacaoSaidaObrigatoriaException extends BadRequestBusinessException {

    public LiberacaoSaidaObrigatoriaException() {
        super("Campo liberadoPor e obrigatorio para registrar saida");
    }
}
