package br.com.infocedro.promocontrol.infra.controller.dto;

import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarPromotorRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 40) String telefone,
        @NotNull Integer fornecedorId,
        @NotNull StatusPromotor status,
        @Size(max = 255) String fotoPath) {
}
