package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.MovimentoPromotorService;
import br.com.infocedro.promocontrol.infra.controller.dto.AjustarHorarioMovimentoRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.MovimentoPromotorResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.RegistrarMovimentoRequest;
import br.com.infocedro.promocontrol.infra.error.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.security.Principal;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/movimentos")
@Tag(name = "Movimentos", description = "Operacoes de entrada, saida, consulta e ajuste de horario")
@SecurityRequirement(name = "basicAuth")
public class MovimentoPromotorController {

    private final MovimentoPromotorService service;
    private final ApiMapper mapper;

    public MovimentoPromotorController(MovimentoPromotorService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/entrada")
    @Operation(summary = "Registrar entrada", description = "Registra entrada de promotor ativo.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Entrada registrada",
                    content = @Content(schema = @Schema(implementation = MovimentoPromotorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Regra de negocio violada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Promotor nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Conflito de concorrencia",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public MovimentoPromotorResponse registrarEntrada(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return mapper.toMovimentoResponse(service.registrarEntrada(
                request.promotorId(),
                request.responsavel(),
                request.observacao()));
    }

    @PostMapping("/saida")
    @Operation(summary = "Registrar saida", description = "Registra saida de promotor com entrada em aberto.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Saida registrada",
                    content = @Content(schema = @Schema(implementation = MovimentoPromotorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Regra de negocio violada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Promotor nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Conflito de concorrencia",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public MovimentoPromotorResponse registrarSaida(@Valid @RequestBody RegistrarMovimentoRequest request) {
        return mapper.toMovimentoResponse(service.registrarSaida(
                request.promotorId(),
                request.responsavel(),
                request.liberadoPor(),
                request.observacao()));
    }

    @PatchMapping("/{movimentoId}/ajuste-horario")
    @Operation(summary = "Ajustar horario de movimento", description = "Ajusta data/hora de um movimento. Requer perfil ADMIN.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Horario ajustado",
                    content = @Content(schema = @Schema(implementation = MovimentoPromotorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Sem permissao",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Movimento nao encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
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
    @Operation(summary = "Listar movimentos", description = "Retorna todos os movimentos registrados.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de movimentos",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = MovimentoPromotorResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<MovimentoPromotorResponse> listar() {
        return service.listar().stream()
                .map(mapper::toMovimentoResponse)
                .toList();
    }
}
