package br.com.infocedro.promocontrol.core.exception;

public class HorarioEncerramentoAutomaticoObrigatorioException extends BadRequestBusinessException {

    public HorarioEncerramentoAutomaticoObrigatorioException() {
        super("Horario de encerramento automatico e obrigatorio quando habilitado");
    }
}
