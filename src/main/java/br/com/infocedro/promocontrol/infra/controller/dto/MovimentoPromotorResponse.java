package br.com.infocedro.promocontrol.infra.controller.dto;

import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import java.time.LocalDateTime;
import java.util.UUID;

public record MovimentoPromotorResponse(
        UUID id,
        UUID promotorId,
        TipoMovimentoPromotor tipo,
        LocalDateTime dataHora,
        String responsavel,
        String observacao,
        LocalDateTime dataHoraOriginal,
        String ajustadoPor,
        LocalDateTime ajustadoEm,
        String ajusteMotivo) {
}
