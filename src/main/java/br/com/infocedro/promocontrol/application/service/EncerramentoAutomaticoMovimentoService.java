package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import java.time.Clock;
import java.time.LocalDateTime;
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
        LocalDateTime agora = LocalDateTime.now(appClock);

        List<MovimentoPromotor> entradasAbertasElegiveis = movimentoRepository.findByTipoAndDataHoraLessThanEqual(
                TipoMovimentoPromotor.ENTRADA,
                agora);

        int totalEncerrado = 0;
        for (MovimentoPromotor entrada : entradasAbertasElegiveis) {
            if (movimentoRepository.existsByPromotor_IdAndTipoAndDataHoraGreaterThanEqual(
                    entrada.getPromotor().getId(),
                    TipoMovimentoPromotor.SAIDA,
                    entrada.getDataHora())) {
                continue;
            }

            ConfiguracaoEmpresa config = configuracaoEmpresaService
                    .buscarPorEmpresaId(entrada.getPromotor().getFornecedor().getId());

            if (!Boolean.TRUE.equals(config.getEncerramentoAutomaticoHabilitado())) {
                continue;
            }

            LocalDateTime dataHoraEncerramento = config.calcularDataHoraEncerramento(entrada.getDataHora().toLocalDate());
            if (dataHoraEncerramento.isAfter(agora)) {
                continue;
            }

            movimentoRepository.save(entrada.encerrarAutomaticamente(config));
            totalEncerrado++;
        }

        return totalEncerrado;
    }
}
