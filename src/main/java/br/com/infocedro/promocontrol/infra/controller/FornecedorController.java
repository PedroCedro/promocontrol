package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.FornecedorService;
import br.com.infocedro.promocontrol.infra.controller.dto.AtualizarFornecedorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarFornecedorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.FornecedorResponse;
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
@RequestMapping("/fornecedores")
public class FornecedorController {

    private final FornecedorService service;
    private final ApiMapper mapper;

    public FornecedorController(FornecedorService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public FornecedorResponse criar(@Valid @RequestBody CriarFornecedorRequest request) {
        return mapper.toFornecedorResponse(service.salvar(mapper.toFornecedor(request)));
    }

    @GetMapping
    public List<FornecedorResponse> listar() {
        return service.listar().stream().map(mapper::toFornecedorResponse).toList();
    }

    @GetMapping("/{id}")
    public FornecedorResponse buscar(@PathVariable Integer id) {
        return mapper.toFornecedorResponse(service.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public FornecedorResponse atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody AtualizarFornecedorRequest request) {
        return mapper.toFornecedorResponse(
                service.atualizar(id, mapper.toFornecedor(request)));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Integer id) {
        service.excluir(id);
    }
}
