package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record EncerrarEntradasSemSaidaRequest(
        @NotNull LocalDate dataInicio,
        @NotNull LocalDate dataFim) {
}
