package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardCumprimentoFornecedorResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardCumprimentoResumoResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardPlanilhaLinhaResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardPlanilhaResumoResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final String FORNECEDOR_SISTEMA_NOME = "fornecedor nao informado";

    private final PromotorRepository promotorRepository;
    private final MovimentoPromotorRepository movimentoRepository;
    private final FornecedorRepository fornecedorRepository;

    public DashboardService(
            PromotorRepository promotorRepository,
            MovimentoPromotorRepository movimentoRepository,
            FornecedorRepository fornecedorRepository) {
        this.promotorRepository = promotorRepository;
        this.movimentoRepository = movimentoRepository;
        this.fornecedorRepository = fornecedorRepository;
    }

    public DashboardPlanilhaResumoResponse obterPlanilhaPrincipal(
            LocalDate data,
            Integer fornecedorId,
            StatusPromotor status) {
        LocalDate dataRef = data == null ? LocalDate.now() : data;
        List<Promotor> promotores = buscarPromotoresFiltrados(fornecedorId, status);
        if (promotores.isEmpty()) {
            return new DashboardPlanilhaResumoResponse(dataRef, 0, 0, 0, 0, List.of());
        }

        List<UUID> promotorIds = promotores.stream().map(Promotor::getId).toList();
        LocalDateTime inicioDia = dataRef.atStartOfDay();
        LocalDateTime fimDia = dataRef.plusDays(1).atStartOfDay().minusNanos(1);

        List<MovimentoPromotor> movimentosDia = movimentoRepository
                .findByPromotor_IdInAndDataHoraBetween(promotorIds, inicioDia, fimDia);

        Map<UUID, List<MovimentoPromotor>> movimentosPorPromotor = movimentosDia.stream()
                .sorted(Comparator.comparing(MovimentoPromotor::getDataHora))
                .collect(Collectors.groupingBy(m -> m.getPromotor().getId()));

        long emLojaAgora = promotores.stream()
                .map(Promotor::getId)
                .map(movimentoRepository::findTopByPromotor_IdOrderByDataHoraDescIdDesc)
                .flatMap(Optional -> Optional.stream())
                .filter(m -> m.getTipo() == TipoMovimentoPromotor.ENTRADA)
                .count();

        long entradasHoje = movimentoRepository.countByPromotor_IdInAndTipoAndDataHoraBetween(
                promotorIds, TipoMovimentoPromotor.ENTRADA, inicioDia, fimDia);
        long saidasHoje = movimentoRepository.countByPromotor_IdInAndTipoAndDataHoraBetween(
                promotorIds, TipoMovimentoPromotor.SAIDA, inicioDia, fimDia);
        long ajustesHoje = movimentosDia.stream()
                .filter(m -> m.getAjustadoEm() != null)
                .filter(m -> !m.getAjustadoEm().isBefore(inicioDia) && !m.getAjustadoEm().isAfter(fimDia))
                .count();

        Map<UUID, Promotor> promotorPorId = promotores.stream()
                .collect(Collectors.toMap(Promotor::getId, Function.identity()));

        List<DashboardPlanilhaLinhaResponse> linhas = movimentosPorPromotor.entrySet().stream()
                .map(entry -> montarLinha(promotorPorId.get(entry.getKey()), entry.getValue()))
                .filter(linha -> linha != null)
                .sorted(Comparator.comparing(DashboardPlanilhaLinhaResponse::fornecedorNome)
                        .thenComparing(DashboardPlanilhaLinhaResponse::promotorNome))
                .toList();

        return new DashboardPlanilhaResumoResponse(
                dataRef,
                emLojaAgora,
                entradasHoje,
                saidasHoje,
                ajustesHoje,
                linhas);
    }

    public DashboardCumprimentoResumoResponse obterCumprimentoFornecedores(
            LocalDate data,
            double percentualMinimo) {
        LocalDate dataRef = data == null ? LocalDate.now() : data;
        double percentualMeta = percentualMinimo <= 0 ? 80.0 : percentualMinimo;
        LocalDateTime inicioDia = dataRef.atStartOfDay();
        LocalDateTime fimDia = dataRef.plusDays(1).atStartOfDay().minusNanos(1);

        List<Fornecedor> fornecedores = fornecedorRepository.findAll().stream()
                .filter(f -> !isFornecedorSistema(f))
                .sorted(Comparator.comparing(Fornecedor::getNome))
                .toList();

        List<Promotor> promotoresAtivos = promotorRepository.findByStatus(StatusPromotor.ATIVO);
        Map<Integer, List<Promotor>> ativosPorFornecedor = promotoresAtivos.stream()
                .collect(Collectors.groupingBy(p -> p.getFornecedor().getId()));

        List<UUID> promotorIds = promotoresAtivos.stream().map(Promotor::getId).toList();
        List<MovimentoPromotor> movimentosDia = promotorIds.isEmpty()
                ? List.of()
                : movimentoRepository.findByPromotor_IdInAndDataHoraBetween(promotorIds, inicioDia, fimDia);

        Map<Integer, LinkedHashSet<UUID>> entradasRealizadasPorFornecedor = movimentosDia.stream()
                .filter(m -> m.getTipo() == TipoMovimentoPromotor.ENTRADA)
                .collect(Collectors.groupingBy(
                        m -> m.getPromotor().getFornecedor().getId(),
                        Collectors.mapping(
                                m -> m.getPromotor().getId(),
                                Collectors.toCollection(LinkedHashSet::new))));

        List<DashboardCumprimentoFornecedorResponse> itens = fornecedores.stream()
                .map(fornecedor -> mapCumprimentoFornecedor(
                        fornecedor,
                        ativosPorFornecedor.getOrDefault(fornecedor.getId(), List.of()).size(),
                        entradasRealizadasPorFornecedor.getOrDefault(fornecedor.getId(), new LinkedHashSet<>()).size(),
                        percentualMeta))
                .toList();

        int alertas = (int) itens.stream().filter(DashboardCumprimentoFornecedorResponse::alerta).count();

        return new DashboardCumprimentoResumoResponse(
                dataRef,
                percentualMeta,
                itens.size(),
                alertas,
                itens);
    }

    private List<Promotor> buscarPromotoresFiltrados(Integer fornecedorId, StatusPromotor status) {
        if (fornecedorId != null && status != null) {
            return promotorRepository.findByFornecedor_IdAndStatus(fornecedorId, status);
        }
        if (fornecedorId != null) {
            return promotorRepository.findByFornecedor_Id(fornecedorId);
        }
        if (status != null) {
            return promotorRepository.findByStatus(status);
        }
        return promotorRepository.findAll();
    }

    private DashboardPlanilhaLinhaResponse montarLinha(Promotor promotor, List<MovimentoPromotor> movimentosDia) {
        MovimentoPromotor ultimaEntrada = movimentosDia.stream()
                .filter(m -> m.getTipo() == TipoMovimentoPromotor.ENTRADA)
                .reduce((anterior, atual) -> atual)
                .orElse(null);

        if (ultimaEntrada == null) {
            return null;
        }

        MovimentoPromotor saidaRelacionada = movimentosDia.stream()
                .filter(m -> m.getTipo() == TipoMovimentoPromotor.SAIDA)
                .filter(m -> !m.getDataHora().isBefore(ultimaEntrada.getDataHora()))
                .findFirst()
                .orElse(null);

        return new DashboardPlanilhaLinhaResponse(
                promotor.getId(),
                promotor.getNome(),
                promotor.getFornecedor().getNome(),
                ultimaEntrada.getDataHora(),
                ultimaEntrada.getResponsavel(),
                saidaRelacionada != null,
                saidaRelacionada != null ? saidaRelacionada.getDataHora() : null,
                saidaRelacionada != null ? saidaRelacionada.getResponsavel() : null,
                saidaRelacionada != null ? saidaRelacionada.getLiberadoPor() : null);
    }

    private DashboardCumprimentoFornecedorResponse mapCumprimentoFornecedor(
            Fornecedor fornecedor,
            int entradasPrevistas,
            int entradasRealizadas,
            double percentualMinimo) {
        double percentualCumprimento;
        if (entradasPrevistas == 0) {
            percentualCumprimento = 100.0;
        } else {
            percentualCumprimento = (entradasRealizadas * 100.0) / entradasPrevistas;
        }

        double desvio = Math.max(0.0, percentualMinimo - percentualCumprimento);
        boolean alerta = entradasPrevistas > 0 && percentualCumprimento < percentualMinimo;

        return new DashboardCumprimentoFornecedorResponse(
                fornecedor.getId(),
                fornecedor.getNome(),
                entradasPrevistas,
                entradasRealizadas,
                round(percentualCumprimento),
                round(desvio),
                alerta);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private boolean isFornecedorSistema(Fornecedor fornecedor) {
        return fornecedor != null
                && fornecedor.getNome() != null
                && fornecedor.getNome().trim().equalsIgnoreCase(FORNECEDOR_SISTEMA_NOME);
    }
}
