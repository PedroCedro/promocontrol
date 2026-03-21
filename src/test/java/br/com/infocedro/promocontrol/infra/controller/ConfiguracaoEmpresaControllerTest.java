package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.ConfiguracaoEmpresaRepository;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "api.base.url=http://localhost:8080")
@AutoConfigureMockMvc
class ConfiguracaoEmpresaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoRepository;

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
    void deveFazerCrudDaConfiguracaoPorEmpresa() throws Exception {
        Fornecedor empresa = criarEmpresa("Empresa Config");

        mockMvc.perform(post("/empresas/" + empresa.getId() + "/configuracao")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "encerramentoAutomaticoHabilitado": true,
                                  "horarioEncerramentoAutomatico": "21:00:00",
                                  "textoObservacaoEncerramentoAutomatico": "Fechamento automatico",
                                  "permitirMultiplasEntradasNoDia": false,
                                  "exigirFotoNaEntrada": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.empresaId").value(empresa.getId()))
                .andExpect(jsonPath("$.encerramentoAutomaticoHabilitado").value(true))
                .andExpect(jsonPath("$.permitirMultiplasEntradasNoDia").value(false));

        mockMvc.perform(get("/empresas/" + empresa.getId() + "/configuracao")
                        .with(httpBasic("viewer", "viewer123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.empresaId").value(empresa.getId()))
                .andExpect(jsonPath("$.exigirFotoNaEntrada").value(true));

        mockMvc.perform(put("/empresas/" + empresa.getId() + "/configuracao")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "encerramentoAutomaticoHabilitado": false,
                                  "horarioEncerramentoAutomatico": "20:30:00",
                                  "textoObservacaoEncerramentoAutomatico": "Atualizado",
                                  "permitirMultiplasEntradasNoDia": true,
                                  "exigirFotoNaEntrada": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.encerramentoAutomaticoHabilitado").value(false))
                .andExpect(jsonPath("$.permitirMultiplasEntradasNoDia").value(true))
                .andExpect(jsonPath("$.exigirFotoNaEntrada").value(false));

        mockMvc.perform(delete("/empresas/" + empresa.getId() + "/configuracao")
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.encerramentoAutomaticoHabilitado").value(false))
                .andExpect(jsonPath("$.horarioEncerramentoAutomatico").value("23:59:00"))
                .andExpect(jsonPath("$.permitirMultiplasEntradasNoDia").value(true));
    }

    @Test
    void deveRetornar400QuandoHorarioAusenteComEncerramentoHabilitado() throws Exception {
        Fornecedor empresa = criarEmpresa("Empresa Horario");

        mockMvc.perform(post("/empresas/" + empresa.getId() + "/configuracao")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "encerramentoAutomaticoHabilitado": true,
                                  "permitirMultiplasEntradasNoDia": true,
                                  "exigirFotoNaEntrada": false
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Horario de encerramento automatico e obrigatorio quando habilitado"));
    }

    private Fornecedor criarEmpresa(String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        fornecedor.setCodigo(100 + (int) (Math.random() * 1000));
        return fornecedorRepository.save(fornecedor);
    }
}
