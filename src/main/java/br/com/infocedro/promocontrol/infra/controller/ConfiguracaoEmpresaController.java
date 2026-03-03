package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.ConfiguracaoEmpresaService;
import br.com.infocedro.promocontrol.infra.controller.dto.ConfiguracaoEmpresaResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.SalvarConfiguracaoEmpresaRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/empresas/{empresaId}/configuracao")
public class ConfiguracaoEmpresaController {

    private final ConfiguracaoEmpresaService service;
    private final ApiMapper mapper;

    public ConfiguracaoEmpresaController(ConfiguracaoEmpresaService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public ConfiguracaoEmpresaResponse criar(
            @PathVariable Integer empresaId,
            @Valid @RequestBody SalvarConfiguracaoEmpresaRequest request) {
        return mapper.toConfiguracaoEmpresaResponse(service.criar(empresaId, mapper.toConfiguracaoEmpresa(request)));
    }

    @GetMapping
    public ConfiguracaoEmpresaResponse buscar(@PathVariable Integer empresaId) {
        return mapper.toConfiguracaoEmpresaResponse(service.buscarPorEmpresaId(empresaId));
    }

    @PutMapping
    public ConfiguracaoEmpresaResponse atualizar(
            @PathVariable Integer empresaId,
            @Valid @RequestBody SalvarConfiguracaoEmpresaRequest request) {
        return mapper.toConfiguracaoEmpresaResponse(service.atualizar(empresaId, mapper.toConfiguracaoEmpresa(request)));
    }

    @DeleteMapping
    public ConfiguracaoEmpresaResponse redefinirParaPadrao(@PathVariable Integer empresaId) {
        return mapper.toConfiguracaoEmpresaResponse(service.redefinirParaPadrao(empresaId));
    }
}
