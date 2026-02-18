package br.com.infocedro.promocontrol.infra.controller;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MovimentoPromotorConcorrenciaTest {

    @LocalServerPort
    private int port;

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

    @AfterEach
    void cleanup() {
        movimentoPromotorRepository.deleteAll();
        promotorRepository.deleteAll();
        fornecedorRepository.deleteAll();
    }

    @Test
    void deveEvitarDuplaEntradaComRequisicoesConcorrentes() throws Exception {
        Promotor promotor = criarPromotor();
        String url = "http://localhost:" + port + "/movimentos/entrada";
        String json = "{\"promotorId\":\"" + promotor.getId() + "\"}";

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Integer> request = () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timeout aguardando inicio concorrente");
            }
            return postEntrada(url, json);
        };

        Future<Integer> first = executor.submit(request);
        Future<Integer> second = executor.submit(request);

        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();

        int status1 = first.get(10, TimeUnit.SECONDS);
        int status2 = second.get(10, TimeUnit.SECONDS);

        executor.shutdownNow();

        List<Integer> statuses = List.of(status1, status2);
        assertThat(statuses).contains(200, 409);

        long entradas = movimentoPromotorRepository
                .countByPromotor_IdAndTipo(promotor.getId(), TipoMovimentoPromotor.ENTRADA);
        assertThat(entradas).isEqualTo(1);
    }

    private int postEntrada(String url, String body) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth("user", "user123");
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response =
                    restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            return response.getStatusCode().value();
        } catch (HttpStatusCodeException ex) {
            return ex.getStatusCode().value();
        }
    }

    private Promotor criarPromotor() {
        Fornecedor fornecedor = criarFornecedor();
        Promotor promotor = new Promotor();
        promotor.setNome("Promotor Teste");
        promotor.setTelefone("123456789");
        promotor.setFornecedor(fornecedor);
        promotor.setStatus(StatusPromotor.ATIVO);
        promotor.setFotoPath("");
        return promotorRepository.save(promotor);
    }

    private Fornecedor criarFornecedor() {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome("Fornecedor Concorrencia");
        fornecedor.setAtivo(true);
        return fornecedorRepository.save(fornecedor);
    }
}
