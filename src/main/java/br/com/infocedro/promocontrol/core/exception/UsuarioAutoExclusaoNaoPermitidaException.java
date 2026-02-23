package br.com.infocedro.promocontrol.core.exception;

public class UsuarioAutoExclusaoNaoPermitidaException extends BadRequestBusinessException {
    public UsuarioAutoExclusaoNaoPermitidaException() {
        super("Nao e permitido excluir o proprio usuario autenticado.");
    }
}
