package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.EntradaEmAbertoException;
import br.com.infocedro.promocontrol.core.exception.FotoObrigatoriaNaEntradaException;
import br.com.infocedro.promocontrol.core.exception.LiberacaoSaidaObrigatoriaException;
import br.com.infocedro.promocontrol.core.exception.MotivoAjusteObrigatorioException;
import br.com.infocedro.promocontrol.core.exception.MovimentoNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.MultiplasEntradasNoDiaNaoPermitidasException;
import br.com.infocedro.promocontrol.core.exception.NovaDataHoraObrigatoriaException;
import br.com.infocedro.promocontrol.core.exception.PromotorInativoOuBloqueadoException;
import br.com.infocedro.promocontrol.core.exception.PromotorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.SemEntradaEmAbertoException;
import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.Clock;
import java.time.LocalDate;
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
    private final ConfiguracaoEmpresaService configuracaoEmpresaService;
    private final Clock appClock;

    public MovimentoPromotorService(
            MovimentoPromotorRepository repository,
            PromotorRepository promotorRepository,
            ConfiguracaoEmpresaService configuracaoEmpresaService,
            Clock appClock) {
        this.repository = repository;
        this.promotorRepository = promotorRepository;
        this.configuracaoEmpresaService = configuracaoEmpresaService;
        this.appClock = appClock;
    }

    @Transactional
    public MovimentoPromotor registrarEntrada(
            UUID promotorId, String responsavel, String observacao) {
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.ENTRADA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.ENTRADA, responsavel, null, observacao);
    }

    @Transactional
    public MovimentoPromotor registrarSaida(
            UUID promotorId, String responsavel, String liberadoPor, String observacao) {
        if (liberadoPor == null || liberadoPor.isBlank()) {
            throw new LiberacaoSaidaObrigatoriaException();
        }
        Promotor promotor = validarNovaMovimentacao(promotorId, TipoMovimentoPromotor.SAIDA);
        return salvarMovimento(promotor, TipoMovimentoPromotor.SAIDA, responsavel, liberadoPor.trim(), observacao);
    }

    public List<MovimentoPromotor> listar() {
        return repository.findAll();
    }

    public List<MovimentoPromotor> listar(Integer fornecedorEscopoId) {
        if (fornecedorEscopoId == null) {
            return listar();
        }
        return repository.findByPromotor_Fornecedor_Id(fornecedorEscopoId);
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
        movimento.setAjustadoEm(LocalDateTime.now(appClock));
        movimento.setAjusteMotivo(motivo.trim());
        return repository.save(movimento);
    }

    @Transactional
    public void excluir(UUID movimentoId) {
        MovimentoPromotor movimento = repository.findById(movimentoId)
                .orElseThrow(MovimentoNaoEncontradoException::new);
        repository.delete(movimento);
    }

    private Promotor validarNovaMovimentacao(UUID promotorId, TipoMovimentoPromotor novoTipo) {
        Promotor promotor = promotorRepository.findWithLockById(promotorId)
                .orElseThrow(PromotorNaoEncontradoException::new);
        ConfiguracaoEmpresa configuracao = buscarConfiguracaoEmpresa(promotor);

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

        if (novoTipo == TipoMovimentoPromotor.ENTRADA && !configuracao.permiteMultiplasEntradasNoDia()) {
            validarEntradaUnicaNoDia(promotor.getId());
        }

        if (novoTipo == TipoMovimentoPromotor.ENTRADA && configuracao.exigeFotoNaEntrada()) {
            validarFotoObrigatoria(promotor);
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
            String liberadoPor,
            String observacao) {
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(tipo);
        movimento.setDataHora(LocalDateTime.now(appClock));
        movimento.setResponsavel(responsavel);
        movimento.setLiberadoPor(liberadoPor);
        movimento.setObservacao(observacao);
        return repository.save(movimento);
    }

    private ConfiguracaoEmpresa buscarConfiguracaoEmpresa(Promotor promotor) {
        return configuracaoEmpresaService.buscarPorEmpresaId(promotor.getFornecedor().getId());
    }

    private void validarEntradaUnicaNoDia(UUID promotorId) {
        LocalDate hoje = LocalDate.now(appClock);
        LocalDateTime inicio = hoje.atStartOfDay();
        LocalDateTime fim = hoje.plusDays(1).atStartOfDay().minusNanos(1);
        long entradasHoje = repository.countByPromotor_IdAndTipoAndDataHoraBetween(
                promotorId,
                TipoMovimentoPromotor.ENTRADA,
                inicio,
                fim);
        if (entradasHoje > 0) {
            throw new MultiplasEntradasNoDiaNaoPermitidasException();
        }
    }

    private void validarFotoObrigatoria(Promotor promotor) {
        if (promotor.getFotoPath() == null || promotor.getFotoPath().isBlank()) {
            throw new FotoObrigatoriaNaEntradaException();
        }
    }
}
