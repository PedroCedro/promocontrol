package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AtualizarEmpresaContratanteRequest(
        @NotBlank String nome,
        String cnpj,
        String email,
        String telefone,
        String uf,
        @NotNull Boolean ativo) {
}

