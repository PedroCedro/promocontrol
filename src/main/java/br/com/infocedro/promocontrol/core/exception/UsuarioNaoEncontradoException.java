package br.com.infocedro.promocontrol.core.exception;

public class UsuarioNaoEncontradoException extends NotFoundBusinessException {

    public UsuarioNaoEncontradoException() {
        super("Usuario nao encontrado");
    }
}
