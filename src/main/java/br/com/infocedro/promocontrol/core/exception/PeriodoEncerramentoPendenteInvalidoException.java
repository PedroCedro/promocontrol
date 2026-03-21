package br.com.infocedro.promocontrol.core.exception;

public class PeriodoEncerramentoPendenteInvalidoException extends BadRequestBusinessException {

    public PeriodoEncerramentoPendenteInvalidoException() {
        super("Periodo informado para entradas sem saida e invalido");
    }
}
