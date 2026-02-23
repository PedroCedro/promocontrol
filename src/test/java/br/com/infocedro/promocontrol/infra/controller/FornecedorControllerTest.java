package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class FornecedorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoPromotorRepository;

    @BeforeEach
    void setup() {
        movimentoPromotorRepository.deleteAll();
        promotorRepository.deleteAll();
        fornecedorRepository.deleteAll();
    }

    @Test
    void deveCriarFornecedorComSucesso() throws Exception {
        mockMvc.perform(post("/fornecedores")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Fornecedor Teste",
                                  "ativo": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.nome").value("Fornecedor Teste"))
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    void deveAtualizarFornecedorComSucesso() throws Exception {
        Fornecedor fornecedor = criarFornecedor("Fornecedor Base");

        mockMvc.perform(put("/fornecedores/" + fornecedor.getId())
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Fornecedor Atualizado",
                                  "ativo": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(fornecedor.getId()))
                .andExpect(jsonPath("$.nome").value("Fornecedor Atualizado"))
                .andExpect(jsonPath("$.ativo").value(false));
    }

    @Test
    void deveListarFornecedoresComSucesso() throws Exception {
        Fornecedor fornecedor = criarFornecedor("Fornecedor Lista");

        mockMvc.perform(get("/fornecedores")
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(fornecedor.getId()))
                .andExpect(jsonPath("$[0].nome").value("Fornecedor Lista"));
    }

    @Test
    void deveExcluirFornecedorComSucesso() throws Exception {
        Fornecedor fornecedor = criarFornecedor("Fornecedor Excluir");

        mockMvc.perform(delete("/fornecedores/" + fornecedor.getId())
                        .with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk());
    }

    private Fornecedor criarFornecedor(String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        return fornecedorRepository.save(fornecedor);
    }
}
