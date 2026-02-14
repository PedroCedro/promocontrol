package br.com.infocedro.promocontrol.core.model;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AuditoriaPersistenceTest {

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoPromotorRepository;

    @BeforeEach
    void setup() {
        movimentoPromotorRepository.deleteAll();
        promotorRepository.deleteAll();
    }

    @Test
    void devePreencherAuditoriaNoPromotor() {
        Promotor promotor = criarPromotor();

        assertThat(promotor.getCreatedAt()).isNotNull();
        assertThat(promotor.getUpdatedAt()).isNotNull();
        assertThat(promotor.getCreatedBy()).isEqualTo("system");
        assertThat(promotor.getUpdatedBy()).isEqualTo("system");
    }

    @Test
    void devePreencherAuditoriaNoMovimento() {
        Promotor promotor = criarPromotor();
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(TipoMovimentoPromotor.ENTRADA);
        movimento.setDataHora(LocalDateTime.now());
        movimento = movimentoPromotorRepository.save(movimento);

        assertThat(movimento.getCreatedAt()).isNotNull();
        assertThat(movimento.getUpdatedAt()).isNotNull();
        assertThat(movimento.getCreatedBy()).isEqualTo("system");
        assertThat(movimento.getUpdatedBy()).isEqualTo("system");
    }

    @Test
    void deveControlarVersaoNoPromotorComLockOtimista() {
        Promotor promotor = criarPromotor();
        Long versaoInicial = promotor.getVersion();

        promotor.setNome("Promotor Atualizado");
        Promotor atualizado = promotorRepository.save(promotor);

        assertThat(versaoInicial).isNotNull();
        assertThat(atualizado.getVersion()).isGreaterThan(versaoInicial);
    }

    private Promotor criarPromotor() {
        Promotor promotor = new Promotor();
        promotor.setNome("Promotor Teste");
        promotor.setTelefone("123456789");
        promotor.setEmpresaId(123);
        promotor.setStatus(StatusPromotor.ATIVO);
        promotor.setFotoPath("");
        return promotorRepository.save(promotor);
    }
}
