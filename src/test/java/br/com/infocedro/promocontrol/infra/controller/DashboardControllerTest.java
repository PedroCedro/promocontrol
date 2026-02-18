package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoRepository;

    @BeforeEach
    void setup() {
        movimentoRepository.deleteAll();
        promotorRepository.deleteAll();
        fornecedorRepository.deleteAll();
    }

    @Test
    void deveRetornarPlanilhaPrincipalComColunasEsperadas() throws Exception {
        Fornecedor fornecedor = criarFornecedor("Fornecedor Dashboard");
        Promotor promotor = criarPromotor("Promotor Dashboard", fornecedor, StatusPromotor.ATIVO);
        criarMovimento(promotor, TipoMovimentoPromotor.ENTRADA, "Operador A", null, LocalDateTime.now().minusHours(2));
        criarMovimento(promotor, TipoMovimentoPromotor.SAIDA, "Operador B", "Gerente A", LocalDateTime.now().minusHours(1));

        String hoje = LocalDate.now().toString();
        mockMvc.perform(get("/dashboard/planilha-principal?data=" + hoje)
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(hoje))
                .andExpect(jsonPath("$.entradasHoje").value(1))
                .andExpect(jsonPath("$.saidasHoje").value(1))
                .andExpect(jsonPath("$.linhas[0].promotorNome").value("Promotor Dashboard"))
                .andExpect(jsonPath("$.linhas[0].fornecedorNome").value("Fornecedor Dashboard"))
                .andExpect(jsonPath("$.linhas[0].saiu").value(true))
                .andExpect(jsonPath("$.linhas[0].usuarioSaida").value("Operador B"))
                .andExpect(jsonPath("$.linhas[0].liberadoPor").value("Gerente A"));
    }

    @Test
    void deveRetornarCumprimentoPorFornecedorComAlerta() throws Exception {
        Fornecedor fornecedorA = criarFornecedor("Fornecedor Cumprimento A");
        Fornecedor fornecedorB = criarFornecedor("Fornecedor Cumprimento B");

        Promotor promotorA1 = criarPromotor("Promotor A1", fornecedorA, StatusPromotor.ATIVO);
        Promotor promotorA2 = criarPromotor("Promotor A2", fornecedorA, StatusPromotor.ATIVO);
        Promotor promotorB1 = criarPromotor("Promotor B1", fornecedorB, StatusPromotor.ATIVO);

        criarMovimento(promotorA1, TipoMovimentoPromotor.ENTRADA, "Operador A", null, LocalDateTime.now().minusHours(3));
        criarMovimento(promotorB1, TipoMovimentoPromotor.ENTRADA, "Operador B", null, LocalDateTime.now().minusHours(2));

        mockMvc.perform(get("/dashboard/cumprimento-fornecedores?percentualMinimo=75")
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.percentualMinimo").value(75.0))
                .andExpect(jsonPath("$.totalFornecedores").value(2))
                .andExpect(jsonPath("$.fornecedoresEmAlerta").value(1))
                .andExpect(jsonPath("$.itens[0].fornecedorNome").exists())
                .andExpect(jsonPath("$.itens[0].entradasPrevistas").exists())
                .andExpect(jsonPath("$.itens[0].entradasRealizadas").exists())
                .andExpect(jsonPath("$.itens[0].percentualCumprimento").exists())
                .andExpect(jsonPath("$.itens[0].desvioPercentual").exists())
                .andExpect(jsonPath("$.itens[0].alerta").exists());
    }

    private Fornecedor criarFornecedor(String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        return fornecedorRepository.save(fornecedor);
    }

    private Promotor criarPromotor(String nome, Fornecedor fornecedor, StatusPromotor status) {
        Promotor promotor = new Promotor();
        promotor.setNome(nome);
        promotor.setTelefone("11999990000");
        promotor.setFornecedor(fornecedor);
        promotor.setStatus(status);
        promotor.setFotoPath("");
        return promotorRepository.save(promotor);
    }

    private MovimentoPromotor criarMovimento(
            Promotor promotor,
            TipoMovimentoPromotor tipo,
            String responsavel,
            String liberadoPor,
            LocalDateTime dataHora) {
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(tipo);
        movimento.setResponsavel(responsavel);
        movimento.setLiberadoPor(liberadoPor);
        movimento.setDataHora(dataHora);
        return movimentoRepository.save(movimento);
    }
}
