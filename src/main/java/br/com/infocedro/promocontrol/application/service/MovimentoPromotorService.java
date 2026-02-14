package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.EntradaEmAbertoException;
import br.com.infocedro.promocontrol.core.exception.MotivoAjusteObrigatorioException;
import br.com.infocedro.promocontrol.core.exception.MovimentoNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.NovaDataHoraObrigatoriaException;
import br.com.infocedro.promocontrol.core.exception.PromotorInativoOuBloqueadoException;
import br.com.infocedro.promocontrol.core.exception.PromotorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.SemEntradaEmAbertoException;
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
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MovimentoPromotorService {

    private final MovimentoPromotorRepository repository;
    private final PromotorRepository promotorRepository;

    public MovimentoPromotorService(
            MovimentoPromotorRepository repository,
            PromotorRepository promotorRepository) {
        this.repository = repository;
        this.promotorRepository = promotorRepository;
    }

    @Transactional
    public MovimentoPromotor registrarEntrada(
            UUID promotorId, String responsavel, String observacao) {
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.ENTRADA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.ENTRADA, responsavel, observacao);
    }

    @Transactional
    public MovimentoPromotor registrarSaida(
            UUID promotorId, String responsavel, String observacao) {
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.SAIDA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.SAIDA, responsavel, observacao);
    }

    public List<MovimentoPromotor> listar() {
        return repository.findAll();
    }

    @Transactional
    public MovimentoPromotor ajustarHorario(
            UUID movimentoId,
            LocalDateTime novaDataHora,
            String motivo,
            String usernameAdmin) {
        MovimentoPromotor movimento = repository.findById(movimentoId)
                .orElseThrow(MovimentoNaoEncontradoException::new);

        if (novaDataHora == null) {
            throw new NovaDataHoraObrigatoriaException();
        }

        if (motivo == null || motivo.isBlank()) {
            throw new MotivoAjusteObrigatorioException();
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
        Promotor promotor = promotorRepository.findWithLockById(promotorId)
                .orElseThrow(PromotorNaoEncontradoException::new);

        if (promotor.getStatus() != StatusPromotor.ATIVO) {
            throw new PromotorInativoOuBloqueadoException();
        }

        TipoMovimentoPromotor ultimoTipo = repository
                .findTopByPromotor_IdOrderByDataHoraDescIdDesc(promotor.getId())
                .map(MovimentoPromotor::getTipo)
                .orElse(null);

        if (novoTipo == TipoMovimentoPromotor.ENTRADA && ultimoTipo == TipoMovimentoPromotor.ENTRADA) {
            throw new EntradaEmAbertoException();
        }

        if (novoTipo == TipoMovimentoPromotor.SAIDA && ultimoTipo != TipoMovimentoPromotor.ENTRADA) {
            throw new SemEntradaEmAbertoException();
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
