package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.EmpresaContratanteService;
import br.com.infocedro.promocontrol.core.model.EmpresaContratante;
import br.com.infocedro.promocontrol.infra.controller.dto.AtualizarEmpresaContratanteRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarEmpresaContratanteRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.EmpresaContratanteResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/empresas-cadastro")
public class EmpresaContratanteController {

    private final EmpresaContratanteService service;

    public EmpresaContratanteController(EmpresaContratanteService service) {
        this.service = service;
    }

    @PostMapping
    public EmpresaContratanteResponse criar(@Valid @RequestBody CriarEmpresaContratanteRequest request) {
        EmpresaContratante empresa = new EmpresaContratante();
        empresa.setNome(request.nome());
        empresa.setCnpj(request.cnpj());
        empresa.setEmail(request.email());
        empresa.setTelefone(request.telefone());
        empresa.setUf(request.uf());
        empresa.setAtivo(request.ativo());
        empresa.setFornecedorId(request.fornecedorId());
        return toResponse(service.criar(empresa));
    }

    @GetMapping
    public List<EmpresaContratanteResponse> listar() {
        return service.listar().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public EmpresaContratanteResponse buscar(@PathVariable Integer id) {
        return toResponse(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public EmpresaContratanteResponse atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody AtualizarEmpresaContratanteRequest request) {
        EmpresaContratante empresa = new EmpresaContratante();
        empresa.setNome(request.nome());
        empresa.setCnpj(request.cnpj());
        empresa.setEmail(request.email());
        empresa.setTelefone(request.telefone());
        empresa.setUf(request.uf());
        empresa.setAtivo(request.ativo());
        return toResponse(service.atualizar(id, empresa));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Integer id) {
        service.excluir(id);
    }

    private EmpresaContratanteResponse toResponse(EmpresaContratante empresa) {
        return new EmpresaContratanteResponse(
                empresa.getId(),
                empresa.getCodigo(),
                empresa.getNome(),
                empresa.getCnpj(),
                empresa.getEmail(),
                empresa.getTelefone(),
                empresa.getUf(),
                empresa.getAtivo(),
                empresa.getFornecedorId());
    }
}

