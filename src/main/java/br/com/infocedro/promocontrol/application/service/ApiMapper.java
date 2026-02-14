package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarPromotorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.MovimentoPromotorResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.PromotorResponse;
import org.springframework.stereotype.Component;

@Component
public class ApiMapper {

    public Promotor toPromotor(CriarPromotorRequest request) {
        Promotor promotor = new Promotor();
        promotor.setNome(request.nome());
        promotor.setTelefone(request.telefone());
        promotor.setEmpresaId(request.empresaId());
        promotor.setStatus(request.status());
        promotor.setFotoPath(request.fotoPath());
        return promotor;
    }

    public PromotorResponse toPromotorResponse(Promotor promotor) {
        return new PromotorResponse(
                promotor.getId(),
                promotor.getNome(),
                promotor.getTelefone(),
                promotor.getEmpresaId(),
                promotor.getStatus(),
                promotor.getFotoPath());
    }

    public MovimentoPromotorResponse toMovimentoResponse(MovimentoPromotor movimento) {
        return new MovimentoPromotorResponse(
                movimento.getId(),
                movimento.getPromotor().getId(),
                movimento.getTipo(),
                movimento.getDataHora(),
                movimento.getResponsavel(),
                movimento.getObservacao(),
                movimento.getDataHoraOriginal(),
                movimento.getAjustadoPor(),
                movimento.getAjustadoEm(),
                movimento.getAjusteMotivo());
    }
}
