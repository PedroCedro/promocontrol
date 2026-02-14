package br.com.infocedro.promocontrol.core.exception;

public class SemEntradaEmAbertoException extends BadRequestBusinessException {

    public SemEntradaEmAbertoException() {
        super("Promotor nao possui entrada em aberto");
    }
}
