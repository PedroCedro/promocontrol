package br.com.infocedro.promocontrol.core.exception;

public class NovaDataHoraObrigatoriaException extends BadRequestBusinessException {

    public NovaDataHoraObrigatoriaException() {
        super("Nova data/hora obrigatoria");
    }
}
