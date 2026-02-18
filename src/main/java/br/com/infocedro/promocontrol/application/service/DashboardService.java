package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardPlanilhaLinhaResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.DashboardPlanilhaResumoResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
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

    private final PromotorRepository promotorRepository;
    private final MovimentoPromotorRepository movimentoRepository;

    public DashboardService(
            PromotorRepository promotorRepository,
            MovimentoPromotorRepository movimentoRepository) {
        this.promotorRepository = promotorRepository;
        this.movimentoRepository = movimentoRepository;
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
}
