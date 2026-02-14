package br.com.infocedro.promocontrol.core.exception;

public class PromotorInativoOuBloqueadoException extends BadRequestBusinessException {

    public PromotorInativoOuBloqueadoException() {
        super("Promotor inativo ou bloqueado");
    }
}
