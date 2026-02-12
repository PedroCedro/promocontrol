package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.MovimentoPromotorService;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.infra.controller.dto.AjustarHorarioMovimentoRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.RegistrarMovimentoRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.security.Principal;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/movimentos")
public class MovimentoPromotorController {

    private final MovimentoPromotorService service;

    public MovimentoPromotorController(MovimentoPromotorService service) {
        this.service = service;
    }

    @PostMapping("/entrada")
    public MovimentoPromotor registrarEntrada(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return service.registrarEntrada(
                request.promotorId(),
                request.responsavel(),
                request.observacao());
    }

    @PostMapping("/saida")
    public MovimentoPromotor registrarSaida(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return service.registrarSaida(
                request.promotorId(),
                request.responsavel(),
                request.observacao());
    }

    @PatchMapping("/{movimentoId}/ajuste-horario")
    public MovimentoPromotor ajustarHorario(
            @PathVariable UUID movimentoId,
            @Valid @RequestBody AjustarHorarioMovimentoRequest request,
            Principal principal) {
        return service.ajustarHorario(
                movimentoId,
                request.novaDataHora(),
                request.motivo(),
                principal.getName());
    }

    @GetMapping
    public List<MovimentoPromotor> listar() {
        return service.listar();
    }
}
