package br.com.infocedro.promocontrol.infra.controller.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardCumprimentoResumoResponse(
        LocalDate data,
        double percentualMinimo,
        int totalFornecedores,
        int fornecedoresEmAlerta,
        List<DashboardCumprimentoFornecedorResponse> itens) {
}
