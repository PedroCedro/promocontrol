package br.com.infocedro.promocontrol.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.ConfiguracaoEmpresaRepository;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class EncerramentoAutomaticoMovimentoServiceTest {

    @Autowired
    private EncerramentoAutomaticoMovimentoService service;

    @Autowired
    private MovimentoPromotorRepository movimentoRepository;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private ConfiguracaoEmpresaRepository configuracaoEmpresaRepository;

    @BeforeEach
    void setup() {
        movimentoRepository.deleteAll();
        promotorRepository.deleteAll();
        configuracaoEmpresaRepository.deleteAll();
        fornecedorRepository.deleteAll();
    }

    @Test
    void deveEncerrarAutomaticamenteMovimentoAbertoDoDiaAnterior() {
        Fornecedor empresa = criarEmpresa();
        Promotor promotor = criarPromotor(empresa);

        ConfiguracaoEmpresa config = ConfiguracaoEmpresa.padrao(empresa);
        config.setEncerramentoAutomaticoHabilitado(true);
        config.setHorarioEncerramentoAutomatico(LocalTime.of(0, 0));
        config.setTextoObservacaoEncerramentoAutomatico("Auto fechamento teste");
        configuracaoEmpresaRepository.save(config);

        MovimentoPromotor entrada = new MovimentoPromotor();
        entrada.setPromotor(promotor);
        entrada.setTipo(TipoMovimentoPromotor.ENTRADA);
        entrada.setDataHora(LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.of(9, 0)));
        movimentoRepository.save(entrada);

        int total = service.encerrarMovimentosAbertosDiaAnterior();

        assertThat(total).isEqualTo(1);
        long saidas = movimentoRepository.countByPromotor_IdAndTipo(promotor.getId(), TipoMovimentoPromotor.SAIDA);
        assertThat(saidas).isEqualTo(1);

        MovimentoPromotor saida = movimentoRepository.findAll().stream()
                .filter(m -> m.getTipo() == TipoMovimentoPromotor.SAIDA)
                .findFirst()
                .orElseThrow();

        assertThat(saida.getObservacao()).isEqualTo("Auto fechamento teste");
        assertThat(saida.getLiberadoPor()).isEqualTo("system");
    }

    @Test
    void deveSerIdempotenteAoRodarJobMaisDeUmaVez() {
        Fornecedor empresa = criarEmpresa();
        Promotor promotor = criarPromotor(empresa);

        ConfiguracaoEmpresa config = ConfiguracaoEmpresa.padrao(empresa);
        config.setEncerramentoAutomaticoHabilitado(true);
        config.setHorarioEncerramentoAutomatico(LocalTime.of(0, 0));
        configuracaoEmpresaRepository.save(config);

        criarEntradaDiaAnterior(promotor);

        int primeiraExecucao = service.encerrarMovimentosAbertosDiaAnterior();
        int segundaExecucao = service.encerrarMovimentosAbertosDiaAnterior();

        assertThat(primeiraExecucao).isEqualTo(1);
        assertThat(segundaExecucao).isEqualTo(0);
        assertThat(movimentoRepository.countByPromotor_IdAndTipo(promotor.getId(), TipoMovimentoPromotor.SAIDA))
                .isEqualTo(1);
    }

    @Test
    void deveAplicarEncerramentoAutomaticoPorEmpresa() {
        Fornecedor empresaA = criarEmpresa("Empresa A");
        Fornecedor empresaB = criarEmpresa("Empresa B");
        Promotor promotorA = criarPromotor(empresaA);
        Promotor promotorB = criarPromotor(empresaB);

        ConfiguracaoEmpresa configA = ConfiguracaoEmpresa.padrao(empresaA);
        configA.setEncerramentoAutomaticoHabilitado(false);
        configA.setHorarioEncerramentoAutomatico(LocalTime.of(0, 0));
        configuracaoEmpresaRepository.save(configA);

        ConfiguracaoEmpresa configB = ConfiguracaoEmpresa.padrao(empresaB);
        configB.setEncerramentoAutomaticoHabilitado(true);
        configB.setHorarioEncerramentoAutomatico(LocalTime.of(0, 0));
        configuracaoEmpresaRepository.save(configB);

        criarEntradaDiaAnterior(promotorA);
        criarEntradaDiaAnterior(promotorB);

        int total = service.encerrarMovimentosAbertosDiaAnterior();

        assertThat(total).isEqualTo(1);
        assertThat(movimentoRepository.countByPromotor_IdAndTipo(promotorA.getId(), TipoMovimentoPromotor.SAIDA))
                .isEqualTo(0);
        assertThat(movimentoRepository.countByPromotor_IdAndTipo(promotorB.getId(), TipoMovimentoPromotor.SAIDA))
                .isEqualTo(1);
    }

    private Fornecedor criarEmpresa() {
        return criarEmpresa("Empresa Auto Fechamento");
    }

    private Fornecedor criarEmpresa(String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        return fornecedorRepository.save(fornecedor);
    }

    private Promotor criarPromotor(Fornecedor fornecedor) {
        Promotor promotor = new Promotor();
        promotor.setNome("Promotor Auto");
        promotor.setTelefone("11999999999");
        promotor.setFornecedor(fornecedor);
        promotor.setStatus(StatusPromotor.ATIVO);
        promotor.setFotoPath("/tmp/foto.png");
        return promotorRepository.save(promotor);
    }

    private MovimentoPromotor criarEntradaDiaAnterior(Promotor promotor) {
        MovimentoPromotor entrada = new MovimentoPromotor();
        entrada.setPromotor(promotor);
        entrada.setTipo(TipoMovimentoPromotor.ENTRADA);
        entrada.setDataHora(LocalDateTime.of(LocalDate.now().minusDays(1), LocalTime.of(9, 0)));
        return movimentoRepository.save(entrada);
    }
}
