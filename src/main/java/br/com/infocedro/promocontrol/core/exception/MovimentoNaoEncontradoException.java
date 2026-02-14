package br.com.infocedro.promocontrol.core.exception;

public class MovimentoNaoEncontradoException extends NotFoundBusinessException {

    public MovimentoNaoEncontradoException() {
        super("Movimento nao encontrado");
    }
}
