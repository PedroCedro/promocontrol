package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RegistrarMovimentoRequest(
        @NotNull UUID promotorId,
        @Size(max = 120) String responsavel,
        @Size(max = 120) String liberadoPor,
        @Size(max = 255) String observacao) {
}
