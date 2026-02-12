package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RegistrarMovimentoRequest(
        @NotNull UUID promotorId,
        String responsavel,
        String observacao) {
}
