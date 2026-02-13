package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class MovimentoPromotorService {

    private final MovimentoPromotorRepository repository;
    private final PromotorRepository promotorRepository;

    public MovimentoPromotorService(
            MovimentoPromotorRepository repository,
            PromotorRepository promotorRepository) {
        this.repository = repository;
        this.promotorRepository = promotorRepository;
    }

    public MovimentoPromotor registrarEntrada(
            UUID promotorId, String responsavel, String observacao) {
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.ENTRADA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.ENTRADA, responsavel, observacao);
    }

    public MovimentoPromotor registrarSaida(
            UUID promotorId, String responsavel, String observacao) {
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.SAIDA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.SAIDA, responsavel, observacao);
    }

    public List<MovimentoPromotor> listar() {
        return repository.findAll();
    }

    public MovimentoPromotor ajustarHorario(
            UUID movimentoId,
            LocalDateTime novaDataHora,
            String motivo,
            String usernameAdmin) {
        MovimentoPromotor movimento = repository.findById(movimentoId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Movimento nao encontrado"));

        if (novaDataHora == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Nova data/hora obrigatoria");
        }

        if (motivo == null || motivo.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Motivo do ajuste obrigatorio");
        }

        if (movimento.getDataHoraOriginal() == null) {
            movimento.setDataHoraOriginal(movimento.getDataHora());
        }

        movimento.setDataHora(novaDataHora);
        movimento.setAjustadoPor(usernameAdmin);
        movimento.setAjustadoEm(LocalDateTime.now());
        movimento.setAjusteMotivo(motivo.trim());
        return repository.save(movimento);
    }

    private Promotor validarNovaMovimentacao(UUID promotorId, TipoMovimentoPromotor novoTipo) {
        Promotor promotor = promotorRepository.findById(promotorId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Promotor nao encontrado"));

        if (promotor.getStatus() != StatusPromotor.ATIVO) {
            throw new ResponseStatusException(BAD_REQUEST, "Promotor inativo ou bloqueado");
        }

        TipoMovimentoPromotor ultimoTipo = repository
                .findTopByPromotor_IdOrderByDataHoraDescIdDesc(promotor.getId())
                .map(MovimentoPromotor::getTipo)
                .orElse(null);

        if (novoTipo == TipoMovimentoPromotor.ENTRADA && ultimoTipo == TipoMovimentoPromotor.ENTRADA) {
            throw new ResponseStatusException(BAD_REQUEST, "Promotor ja esta com entrada em aberto");
        }

        if (novoTipo == TipoMovimentoPromotor.SAIDA && ultimoTipo != TipoMovimentoPromotor.ENTRADA) {
            throw new ResponseStatusException(BAD_REQUEST, "Promotor nao possui entrada em aberto");
        }

        return promotor;
    }

    private MovimentoPromotor salvarMovimento(
            Promotor promotor,
            TipoMovimentoPromotor tipo,
            String responsavel,
            String observacao) {
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(tipo);
        movimento.setDataHora(LocalDateTime.now());
        movimento.setResponsavel(responsavel);
        movimento.setObservacao(observacao);
        return repository.save(movimento);
    }
}
