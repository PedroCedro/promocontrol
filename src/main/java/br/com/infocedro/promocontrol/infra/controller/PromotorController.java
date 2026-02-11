package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.PromotorService;
import br.com.infocedro.promocontrol.core.model.Promotor;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/promotores")
public class PromotorController {

    private final PromotorService service;

    public PromotorController(PromotorService service) {
        this.service = service;
    }

    @PostMapping
    public Promotor criar(@RequestBody Promotor promotor) {
        return service.salvar(promotor);
    }
    @GetMapping
    public List<Promotor> listar() {
    return service.listar();
}

}
