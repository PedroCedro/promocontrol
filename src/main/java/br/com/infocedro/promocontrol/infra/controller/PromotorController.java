package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.PromotorService;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarPromotorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.PromotorResponse;
import jakarta.validation.Valid;
import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/promotores")
public class PromotorController {

    private final PromotorService service;
    private final ApiMapper mapper;

    public PromotorController(PromotorService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    public PromotorResponse criar(@Valid @RequestBody CriarPromotorRequest request) {
        return mapper.toPromotorResponse(service.salvar(mapper.toPromotor(request)));
    }

    @GetMapping
    public List<PromotorResponse> listar() {
        return service.listar().stream()
                .map(mapper::toPromotorResponse)
                .toList();
    }

}
