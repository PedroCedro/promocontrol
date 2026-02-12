package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record AjustarHorarioMovimentoRequest(
        @NotNull LocalDateTime novaDataHora,
        @NotBlank String motivo) {
}
