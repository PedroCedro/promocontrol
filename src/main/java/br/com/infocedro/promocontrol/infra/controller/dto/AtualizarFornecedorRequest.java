package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarFornecedorRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull Boolean ativo) {
}
