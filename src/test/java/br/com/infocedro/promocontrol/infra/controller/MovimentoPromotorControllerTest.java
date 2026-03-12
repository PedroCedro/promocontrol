package br.com.infocedro.promocontrol.infra.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.ConfiguracaoEmpresaRepository;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import br.com.infocedro.promocontrol.core.repository.UsuarioRepository;
import br.com.infocedro.promocontrol.core.model.Usuario;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private ConfiguracaoEmpresaRepository configuracaoEmpresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        movimentoPromotorRepository.deleteAll();
        usuarioRepository.findByUsernameIgnoreCase("fornecedor.teste")
                .ifPresent(usuarioRepository::delete);
        promotorRepository.deleteAll();
        configuracaoEmpresaRepository.deleteAll();
        fornecedorRepository.deleteAll();
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
                        .content("{\"promotorId\":\"" + promotor.getId() + "\",\"liberadoPor\":\"Gerente\"}"))
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
                        .content("{\"promotorId\":\"" + promotor.getId() + "\",\"liberadoPor\":\"Gerente\"}"))
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
    void deveRetornar400QuandoSaidaSemLiberacao() throws Exception {
        Promotor promotor = criarPromotor();

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/movimentos/saida")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Campo liberadoPor e obrigatorio para registrar saida"));
    }

    @Test
    void deveRetornar400QuandoConfiguracaoExigeFotoNaEntrada() throws Exception {
        Promotor promotor = criarPromotor();
        criarConfiguracao(promotor.getFornecedor(), true, true);

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Configuracao da empresa exige foto para registrar entrada"));
    }

    @Test
    void deveRetornar400QuandoConfiguracaoNaoPermiteMultiplasEntradasNoDia() throws Exception {
        Promotor promotor = criarPromotor();
        promotor.setFotoPath("/img/foto.jpg");
        promotorRepository.save(promotor);
        criarConfiguracao(promotor.getFornecedor(), false, false);

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/movimentos/saida")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\",\"liberadoPor\":\"Gerente\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("user", "user123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"promotorId\":\"" + promotor.getId() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Configuracao da empresa nao permite multiplas entradas no mesmo dia"));
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

    @Test
    void devePermitirAjusteHorarioQuandoAdminComAuditoria() throws Exception {
        MovimentoPromotor movimento = criarMovimento();

        mockMvc.perform(patch("/movimentos/" + movimento.getId() + "/ajuste-horario")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(APPLICATION_JSON)
                        .content("{\"novaDataHora\":\"2026-02-12T10:00:00\",\"motivo\":\"Correcao operacional\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(movimento.getId().toString()))
                .andExpect(jsonPath("$.tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.dataHora").value("2026-02-12T10:00:00"))
                .andExpect(jsonPath("$.dataHoraOriginal").exists())
                .andExpect(jsonPath("$.ajustadoPor").value("admin"))
                .andExpect(jsonPath("$.ajustadoEm").exists())
                .andExpect(jsonPath("$.ajusteMotivo").value("Correcao operacional"));
    }

    @Test
    void deveListarMovimentosComContratoEsperado() throws Exception {
        MovimentoPromotor movimento = criarMovimento();

        mockMvc.perform(get("/movimentos")
                        .with(httpBasic("user", "user123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(movimento.getId().toString()))
                .andExpect(jsonPath("$[0].promotorId").value(movimento.getPromotor().getId().toString()))
                .andExpect(jsonPath("$[0].tipo").value("ENTRADA"))
                .andExpect(jsonPath("$[0].dataHora").exists());
    }

    @Test
    void deveListarApenasMovimentosDoFornecedorNoEscopo() throws Exception {
        Fornecedor fornecedorEscopado = criarFornecedor("Fornecedor Escopado");
        Fornecedor outroFornecedor = criarFornecedor("Fornecedor Externo");
        criarUsuarioFornecedor("fornecedor.teste", "fornecedor123", fornecedorEscopado);

        MovimentoPromotor movimentoEscopado = criarMovimento(fornecedorEscopado);
        criarMovimento(outroFornecedor);

        mockMvc.perform(get("/movimentos")
                        .with(httpBasic("fornecedor.teste", "fornecedor123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(movimentoEscopado.getId().toString()))
                .andExpect(jsonPath("$[0].promotorId").value(movimentoEscopado.getPromotor().getId().toString()));
    }

    private Promotor criarPromotor() {
        Fornecedor fornecedor = criarFornecedor();
        return criarPromotor(fornecedor);
    }

    private Promotor criarPromotor(Fornecedor fornecedor) {
        return criarPromotor(fornecedor, "Promotor Teste");
    }

    private Promotor criarPromotor(Fornecedor fornecedor, String nome) {
        Promotor promotor = new Promotor();
        promotor.setNome(nome);
        promotor.setTelefone("123456789");
        promotor.setFornecedor(fornecedor);
        promotor.setStatus(StatusPromotor.ATIVO);
        promotor.setFotoPath("");
        return promotorRepository.save(promotor);
    }

    private Fornecedor criarFornecedor() {
        return criarFornecedor("Fornecedor Teste");
    }

    private Fornecedor criarFornecedor(String nome) {
        Fornecedor fornecedor = new Fornecedor();
        fornecedor.setNome(nome);
        fornecedor.setAtivo(true);
        Fornecedor salvo = fornecedorRepository.save(fornecedor);
        configuracaoEmpresaRepository.save(ConfiguracaoEmpresa.padrao(salvo));
        return salvo;
    }

    private MovimentoPromotor criarMovimento() {
        Promotor promotor = criarPromotor();
        return criarMovimento(promotor);
    }

    private MovimentoPromotor criarMovimento(Fornecedor fornecedor) {
        Promotor promotor = criarPromotor(fornecedor, "Promotor " + fornecedor.getNome());
        return criarMovimento(promotor);
    }

    private MovimentoPromotor criarMovimento(Promotor promotor) {
        MovimentoPromotor movimento = new MovimentoPromotor();
        movimento.setPromotor(promotor);
        movimento.setTipo(TipoMovimentoPromotor.ENTRADA);
        movimento.setDataHora(LocalDateTime.now());
        return movimentoPromotorRepository.save(movimento);
    }

    private void criarConfiguracao(Fornecedor fornecedor, boolean exigirFoto, boolean permitirMultiplasEntradasNoDia) {
        ConfiguracaoEmpresa configuracao = configuracaoEmpresaRepository.findByEmpresa_Id(fornecedor.getId())
                .orElseGet(() -> ConfiguracaoEmpresa.padrao(fornecedor));
        configuracao.setExigirFotoNaEntrada(exigirFoto);
        configuracao.setPermitirMultiplasEntradasNoDia(permitirMultiplasEntradasNoDia);
        configuracaoEmpresaRepository.save(configuracao);
    }

    private void criarUsuarioFornecedor(String username, String senha, Fornecedor fornecedor) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setCodigo(proximoCodigoUsuario());
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuario.setPerfil("FORNECEDOR");
        usuario.setPrecisaTrocarSenha(false);
        usuario.setAtivo(true);
        usuario.setAcessaWeb(true);
        usuario.setAcessaMobile(false);
        usuario.setFornecedor(fornecedor);
        usuarioRepository.save(usuario);
    }

    private int proximoCodigoUsuario() {
        return usuarioRepository.findTopByOrderByCodigoDesc()
                .map(codigo -> codigo.getCodigo() + 1)
                .orElse(1);
    }
}
