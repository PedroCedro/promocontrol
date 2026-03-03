package br.com.infocedro.promocontrol.infra.job;

import br.com.infocedro.promocontrol.application.service.EncerramentoAutomaticoMovimentoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EncerramentoAutomaticoMovimentoJob {

    private static final Logger logger = LoggerFactory.getLogger(EncerramentoAutomaticoMovimentoJob.class);

    private final EncerramentoAutomaticoMovimentoService service;

    public EncerramentoAutomaticoMovimentoJob(EncerramentoAutomaticoMovimentoService service) {
        this.service = service;
    }

    @Scheduled(cron = "${app.movimento.encerramento-automatico.cron:0 */15 * * * *}")
    public void executar() {
        int totalEncerrado = service.encerrarMovimentosAbertosDiaAnterior();
        if (totalEncerrado > 0) {
            logger.info("Encerramento automatico executado com {} movimentos fechados", totalEncerrado);
        }
    }
}
