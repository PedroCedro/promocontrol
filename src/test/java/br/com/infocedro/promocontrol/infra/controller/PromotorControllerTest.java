package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PromotorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoPromotorRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @BeforeEach
    void setup() {
        movimentoPromotorRepository.deleteAll();
        promotorRepository.deleteAll();
        fornecedorRepository.deleteAll();
    }

    @Test
    void deveCriarPromotorComSucesso() throws Exception {
        mockMvc.perform(post("/promotores")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Promotor Teste",
                                  "telefone": "11999999999",
                                  "fornecedorId": %d,
                                  "status": "ATIVO",
                                  "fotoPath": ""
                                }
                                """.formatted(criarFornecedor().getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Promotor Teste"))
                .andExpect(jsonPath("$.fornecedorId").exists())
                .andExpect(jsonPath("$.status").value("ATIVO"));
    }

    @Test
    void deveRetornar400QuandoPayloadInvalidoNoCadastro() throws Exception {
        mockMvc.perform(post("/promotores")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "telefone": "11999999999",
                                  "fornecedorId": 1,
                                  "status": "ATIVO"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/promotores"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveListarPromotoresComSucesso() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(get("/promotores")
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(promotor.getId().toString()))
                .andExpect(jsonPath("$[0].nome").value("Promotor Base"))
                .andExpect(jsonPath("$[0].status").value("ATIVO"));
    }

    @Test
    void deveRetornar401QuandoListarPromotoresSemAutenticacao() throws Exception {
        mockMvc.perform(get("/promotores"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/promotores"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    private Promotor criarPromotor() {
        Fornecedor fornecedor = criarFornecedor();
        Promotor promotor = new Promotor();
        promotor.setNome("Promotor Base");
        promotor.setTelefone("1133334444");
        promotor.setFornecedor(fornecedor);
        promotor.setStatus(StatusPromotor.ATIVO);
        promotor.setFotoPath("");
        return promotorRepository.save(promotor);
    }

    private Fornecedor criarFornecedor() {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome("Fornecedor Base");
        fornecedor.setAtivo(true);
        return fornecedorRepository.save(fornecedor);
    }
}
