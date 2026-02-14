package br.com.infocedro.promocontrol.core.exception;

public class PromotorNaoEncontradoException extends NotFoundBusinessException {

    public PromotorNaoEncontradoException() {
        super("Promotor nao encontrado");
    }
}
