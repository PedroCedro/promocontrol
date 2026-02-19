package br.com.infocedro.promocontrol.core.exception;

public class UsuarioJaExisteException extends BadRequestBusinessException {

    public UsuarioJaExisteException() {
        super("Usuario ja existe");
    }
}
