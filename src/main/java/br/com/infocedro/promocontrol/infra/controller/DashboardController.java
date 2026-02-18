package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.DashboardService;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardCumprimentoResumoResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardPlanilhaResumoResponse;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/planilha-principal")
    public DashboardPlanilhaResumoResponse planilhaPrincipal(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) Integer fornecedorId,
            @RequestParam(required = false) StatusPromotor status) {
        return service.obterPlanilhaPrincipal(data, fornecedorId, status);
    }

    @GetMapping("/cumprimento-fornecedores")
    public DashboardCumprimentoResumoResponse cumprimentoFornecedores(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false, defaultValue = "80") double percentualMinimo) {
        return service.obterCumprimentoFornecedores(data, percentualMinimo);
    }
}
