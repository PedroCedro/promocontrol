package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public record SalvarConfiguracaoEmpresaRequest(
        @NotNull Boolean encerramentoAutomaticoHabilitado,
        LocalTime horarioEncerramentoAutomatico,
        @Size(max = 255) String textoObservacaoEncerramentoAutomatico,
        @NotNull Boolean permitirMultiplasEntradasNoDia,
        @NotNull Boolean exigirFotoNaEntrada) {
}
