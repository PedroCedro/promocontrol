package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.infra.controller.dto.AtualizarPromotorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.AtualizarFornecedorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarFornecedorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarPromotorRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.FornecedorResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.MovimentoPromotorResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.PromotorResponse;
import org.springframework.stereotype.Component;

@Component
public class ApiMapper {

    public Promotor toPromotor(CriarPromotorRequest request) {
        Promotor promotor = new Promotor();
        promotor.setNome(request.nome());
        promotor.setTelefone(request.telefone());
        promotor.setStatus(request.status());
        promotor.setFotoPath(request.fotoPath());
        return promotor;
    }

    public Promotor toPromotor(AtualizarPromotorRequest request) {
        Promotor promotor = new Promotor();
        promotor.setNome(request.nome());
        promotor.setTelefone(request.telefone());
        promotor.setStatus(request.status());
        promotor.setFotoPath(request.fotoPath());
        return promotor;
    }

    public PromotorResponse toPromotorResponse(Promotor promotor) {
        return new PromotorResponse(
                promotor.getId(),
                promotor.getCodigo(),
                promotor.getNome(),
                promotor.getTelefone(),
                promotor.getFornecedor().getId(),
                promotor.getFornecedor().getCodigo(),
                promotor.getFornecedor().getNome(),
                promotor.getStatus(),
                promotor.getFotoPath());
    }

    public Fornecedor toFornecedor(CriarFornecedorRequest request) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(request.nome());
        fornecedor.setAtivo(request.ativo());
        return fornecedor;
    }

    public Fornecedor toFornecedor(AtualizarFornecedorRequest request) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(request.nome());
        fornecedor.setAtivo(request.ativo());
        return fornecedor;
    }

    public FornecedorResponse toFornecedorResponse(Fornecedor fornecedor) {
        return new FornecedorResponse(
                fornecedor.getId(),
                fornecedor.getCodigo(),
                fornecedor.getNome(),
                fornecedor.getAtivo());
    }

    public MovimentoPromotorResponse toMovimentoResponse(MovimentoPromotor movimento) {
        return new MovimentoPromotorResponse(
                movimento.getId(),
                movimento.getPromotor().getId(),
                movimento.getTipo(),
                movimento.getDataHora(),
                movimento.getResponsavel(),
                movimento.getLiberadoPor(),
                movimento.getObservacao(),
                movimento.getDataHoraOriginal(),
                movimento.getAjustadoPor(),
                movimento.getAjustadoEm(),
                movimento.getAjusteMotivo());
    }
}
