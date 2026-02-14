package br.com.infocedro.promocontrol.core.exception;

public class EntradaEmAbertoException extends BadRequestBusinessException {

    public EntradaEmAbertoException() {
        super("Promotor ja esta com entrada em aberto");
    }
}
