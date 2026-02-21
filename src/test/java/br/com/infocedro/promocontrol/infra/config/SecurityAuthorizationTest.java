package br.com.infocedro.promocontrol.infra.config;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import br.com.infocedro.promocontrol.core.repository.UsuarioRepository;
import br.com.infocedro.promocontrol.infra.security.AuthUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    @Autowired
    private PromotorRepository promotorRepository;

    @Autowired
    private MovimentoPromotorRepository movimentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuthUserService authUserService;

    @BeforeEach
    void setup() {
        movimentoRepository.deleteAll();
        promotorRepository.deleteAll();
        fornecedorRepository.deleteAll();
        if (!usuarioRepository.existsByUsername("gestor")) {
            authUserService.createUserByAdmin("gestor", "GESTOR", "ATIVO");
            authUserService.changePassword("gestor", "gestor123");
        }
    }

    @Test
    void viewerDeveLerPromotores() throws Exception {
        mockMvc.perform(get("/promotores")
                        .with(httpBasic("viewer", "viewer123")))
                .andExpect(status().isOk());
    }

    @Test
    void viewerNaoDeveCriarFornecedor() throws Exception {
        mockMvc.perform(post("/fornecedores")
                        .with(httpBasic("viewer", "viewer123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Fornecedor Bloqueado",
                                  "ativo": true
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void viewerNaoDeveEditarUsuario() throws Exception {
        mockMvc.perform(patch("/auth/admin/usuarios/viewer")
                        .with(httpBasic("viewer", "viewer123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "viewer",
                                  "perfil": "ADMIN",
                                  "status": "ATIVO"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void gestorDeveGerenciarUsuarios() throws Exception {
        mockMvc.perform(get("/auth/admin/usuarios")
                        .with(httpBasic("gestor", "gestor123")))
                .andExpect(status().isOk());
    }

    @Test
    void gestorNaoDeveRegistrarMovimento() throws Exception {
        mockMvc.perform(post("/movimentos/entrada")
                        .with(httpBasic("gestor", "gestor123"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "promotorId": 1,
                                  "responsavel": "gestor",
                                  "observacao": "teste"
                                }
                                """))
                .andExpect(status().isForbidden());
    }
}
