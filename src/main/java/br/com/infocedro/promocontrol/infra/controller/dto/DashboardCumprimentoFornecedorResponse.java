package br.com.infocedro.promocontrol.infra.controller.dto;

public record DashboardCumprimentoFornecedorResponse(
        Integer fornecedorId,
        String fornecedorNome,
        int entradasPrevistas,
        int entradasRealizadas,
        double percentualCumprimento,
        double desvioPercentual,
        boolean alerta) {
}
