package br.com.infocedro.promocontrol.infra.config;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ObservabilitySecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void devePermitirHealthSemAutenticacao() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void deveRetornarCorrelationIdMesmoQuandoNaoAutenticado() throws Exception {
        mockMvc.perform(get("/promotores"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Correlation-Id", not(blankOrNullString())));
    }

    @Test
    void devePropagarCorrelationIdRecebidoNoRequest() throws Exception {
        mockMvc.perform(get("/promotores").header("X-Correlation-Id", "corr-test-123"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Correlation-Id", "corr-test-123"));
    }
}
