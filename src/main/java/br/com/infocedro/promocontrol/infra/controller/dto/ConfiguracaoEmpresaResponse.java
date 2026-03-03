package br.com.infocedro.promocontrol.infra.controller.dto;

import java.time.LocalTime;

public record ConfiguracaoEmpresaResponse(
        Integer id,
        Integer empresaId,
        Boolean encerramentoAutomaticoHabilitado,
        LocalTime horarioEncerramentoAutomatico,
        String textoObservacaoEncerramentoAutomatico,
        Boolean permitirMultiplasEntradasNoDia,
        Boolean exigirFotoNaEntrada) {
}
