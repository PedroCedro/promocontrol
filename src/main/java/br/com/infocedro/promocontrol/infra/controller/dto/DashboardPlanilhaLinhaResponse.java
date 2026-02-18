package br.com.infocedro.promocontrol.infra.controller.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DashboardPlanilhaLinhaResponse(
        UUID promotorId,
        String promotorNome,
        String fornecedorNome,
        LocalDateTime entradaEm,
        String usuarioEntrada,
        boolean saiu,
        LocalDateTime saidaEm,
        String usuarioSaida,
        String liberadoPor) {
}
