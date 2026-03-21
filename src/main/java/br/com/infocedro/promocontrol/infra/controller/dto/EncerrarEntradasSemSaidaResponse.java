package br.com.infocedro.promocontrol.infra.controller.dto;

import java.time.LocalDate;

public record EncerrarEntradasSemSaidaResponse(
        LocalDate dataInicio,
        LocalDate dataFim,
        int totalEncerrado) {
}
