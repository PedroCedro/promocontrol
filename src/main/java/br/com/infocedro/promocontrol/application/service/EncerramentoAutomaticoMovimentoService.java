package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EncerramentoAutomaticoMovimentoService {

    private final MovimentoPromotorRepository movimentoRepository;
    private final ConfiguracaoEmpresaService configuracaoEmpresaService;
    private final Clock appClock;

    public EncerramentoAutomaticoMovimentoService(
            MovimentoPromotorRepository movimentoRepository,
            ConfiguracaoEmpresaService configuracaoEmpresaService,
            Clock appClock) {
        this.movimentoRepository = movimentoRepository;
        this.configuracaoEmpresaService = configuracaoEmpresaService;
        this.appClock = appClock;
    }

    @Transactional
    public int encerrarMovimentosAbertosDiaAnterior() {
        LocalDate ontem = LocalDate.now(appClock).minusDays(1);
        LocalDateTime inicio = ontem.atStartOfDay();
        LocalDateTime fim = ontem.plusDays(1).atStartOfDay().minusNanos(1);
        LocalTime horarioAtual = LocalTime.now(appClock);

        List<MovimentoPromotor> entradasDiaAnterior = movimentoRepository.findByTipoAndDataHoraBetween(
                TipoMovimentoPromotor.ENTRADA,
                inicio,
                fim);

        int totalEncerrado = 0;
        for (MovimentoPromotor entrada : entradasDiaAnterior) {
            if (movimentoRepository.existsByPromotor_IdAndTipoAndDataHoraGreaterThanEqual(
                    entrada.getPromotor().getId(),
                    TipoMovimentoPromotor.SAIDA,
                    entrada.getDataHora())) {
                continue;
            }

            ConfiguracaoEmpresa config = configuracaoEmpresaService
                    .buscarPorEmpresaId(entrada.getPromotor().getFornecedor().getId());

            if (!config.deveEncerrarAutomaticamente(horarioAtual)) {
                continue;
            }

            movimentoRepository.save(entrada.encerrarAutomaticamente(config));
            totalEncerrado++;
        }

        return totalEncerrado;
    }
}
