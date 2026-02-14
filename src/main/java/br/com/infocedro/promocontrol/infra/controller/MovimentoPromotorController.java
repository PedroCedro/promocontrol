package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.MovimentoPromotorService;
import br.com.infocedro.promocontrol.infra.controller.dto.AjustarHorarioMovimentoRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.MovimentoPromotorResponse;
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
    private final ApiMapper mapper;

    public MovimentoPromotorController(MovimentoPromotorService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/entrada")
    public MovimentoPromotorResponse registrarEntrada(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return mapper.toMovimentoResponse(service.registrarEntrada(
                request.promotorId(),
                request.responsavel(),
                request.observacao()));
    }

    @PostMapping("/saida")
    public MovimentoPromotorResponse registrarSaida(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return mapper.toMovimentoResponse(service.registrarSaida(
                request.promotorId(),
                request.responsavel(),
                request.observacao()));
    }

    @PatchMapping("/{movimentoId}/ajuste-horario")
    public MovimentoPromotorResponse ajustarHorario(
            @PathVariable UUID movimentoId,
            @Valid @RequestBody AjustarHorarioMovimentoRequest request,
            Principal principal) {
        return mapper.toMovimentoResponse(service.ajustarHorario(
                movimentoId,
                request.novaDataHora(),
                request.motivo(),
                principal.getName()));
    }

    @GetMapping
    public List<MovimentoPromotorResponse> listar() {
        return service.listar().stream()
                .map(mapper::toMovimentoResponse)
                .toList();
    }
}
