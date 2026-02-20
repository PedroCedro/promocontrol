package br.com.infocedro.promocontrol.infra.controller.dto;

import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import java.util.UUID;

public record PromotorResponse(
        UUID id,
        Integer codigo,
        String nome,
        String telefone,
        Integer fornecedorId,
        Integer fornecedorCodigo,
        String fornecedorNome,
        StatusPromotor status,
        String fotoPath) {
}
