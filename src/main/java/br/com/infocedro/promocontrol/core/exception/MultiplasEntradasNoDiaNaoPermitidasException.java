package br.com.infocedro.promocontrol.core.exception;

public class MultiplasEntradasNoDiaNaoPermitidasException extends BadRequestBusinessException {

    public MultiplasEntradasNoDiaNaoPermitidasException() {
        super("Configuracao da empresa nao permite multiplas entradas no mesmo dia");
    }
}
