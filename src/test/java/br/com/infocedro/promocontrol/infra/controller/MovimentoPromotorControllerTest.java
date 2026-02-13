package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class MovimentoPromotorControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
    void deveRegistrarEntradaESaidaComSucesso() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("ENTRADA"));

        mockMvc.perform(post("/movimentos/saida")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("SAIDA"));
    }

    @Test
    void deveRetornar400QuandoJaExisteEntradaEmAberto() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/movimentos/entrada"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar400QuandoSaidaSemEntrada() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(post("/movimentos/saida")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/movimentos/saida"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar400QuandoPromotorInativoOuBloqueado() throws Exception {
        Promotor promotor = criarPromotor();
        promotor.setStatus(StatusPromotor.BLOQUEADO);
        promotorRepository.save(promotor);

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").value("Promotor inativo ou bloqueado"))
                .andExpect(jsonPath("$.path").value("/movimentos/entrada"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar400QuandoPayloadInvalido() throws Exception {
        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/movimentos/entrada"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar401QuandoSemAutenticacao() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(post("/movimentos/entrada")
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/movimentos/entrada"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar403QuandoUsuarioComumTentaAjustarHorario() throws Exception {
        MovimentoPromotor movimento = criarMovimento();

        mockMvc.perform(patch("/movimentos/" + movimento.getId() + "/ajuste-horario")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"novaDataHora\":\"2026-02-12T10:00:00\",\"motivo\":\"Correcao\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path")
                        .value("/movimentos/" + movimento.getId() + "/ajuste-horario"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar404QuandoPromotorNaoExiste() throws Exception {
        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/movimentos/entrada"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void deveRetornar404QuandoMovimentoNaoExisteNoAjuste() throws Exception {
        UUID movimentoIdInexistente = UUID.randomUUID();

        mockMvc.perform(patch("/movimentos/" + movimentoIdInexistente + "/ajuste-horario")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"novaDataHora\":\"2026-02-12T10:00:00\",\"motivo\":\"Correcao\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path")
                        .value("/movimentos/" + movimentoIdInexistente + "/ajuste-horario"))
                .andExpect(jsonPath("$.timestamp").exists());
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

    private MovimentoPromotor criarMovimento() {
        Promotor promotor = criarPromotor();
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(TipoMovimentoPromotor.ENTRADA);
        movimento.setDataHora(LocalDateTime.now());
        return movimentoPromotorRepository.save(movimento);
    }
}
