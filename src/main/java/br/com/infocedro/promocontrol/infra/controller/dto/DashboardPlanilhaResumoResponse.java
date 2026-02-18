package br.com.infocedro.promocontrol.infra.controller.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardPlanilhaResumoResponse(
        LocalDate data,
        long emLojaAgora,
        long entradasHoje,
        long saidasHoje,
        long ajustesHoje,
        List<DashboardPlanilhaLinhaResponse> linhas) {
}
