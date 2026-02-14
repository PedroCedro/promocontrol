package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.application.service.ApiMapper;
import br.com.infocedro.promocontrol.application.service.PromotorService;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarPromotorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.PromotorResponse;
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

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/promotores")
@Tag(name = "Promotores", description = "Operacoes de cadastro e consulta de promotores")
@SecurityRequirement(name = "basicAuth")
public class PromotorController {

    private final PromotorService service;
    private final ApiMapper mapper;

    public PromotorController(PromotorService service, ApiMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    @Operation(summary = "Criar promotor", description = "Cria um novo promotor ativo/inativo/bloqueado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Promotor criado",
                    content = @Content(schema = @Schema(implementation = PromotorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public PromotorResponse criar(@Valid @RequestBody CriarPromotorRequest request) {
        return mapper.toPromotorResponse(service.salvar(mapper.toPromotor(request)));
    }

    @GetMapping
    @Operation(summary = "Listar promotores", description = "Retorna a lista completa de promotores.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de promotores",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PromotorResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<PromotorResponse> listar() {
        return service.listar().stream()
                .map(mapper::toPromotorResponse)
                .toList();
    }

}
