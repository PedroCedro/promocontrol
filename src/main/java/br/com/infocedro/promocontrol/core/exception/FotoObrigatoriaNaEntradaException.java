package br.com.infocedro.promocontrol.core.exception;

public class FotoObrigatoriaNaEntradaException extends BadRequestBusinessException {

    public FotoObrigatoriaNaEntradaException() {
        super("Configuracao da empresa exige foto para registrar entrada");
    }
}
