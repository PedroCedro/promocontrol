package br.com.infocedro.promocontrol.infra.controller;

import br.com.infocedro.promocontrol.infra.controller.dto.AlterarSenhaRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.AtualizarUsuarioRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarUsuarioRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.CriarUsuarioResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.ResetarSenhaUsuarioRequest;
import br.com.infocedro.promocontrol.infra.controller.dto.ResetarSenhaUsuarioResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.SessaoUsuarioResponse;
import br.com.infocedro.promocontrol.infra.controller.dto.UsuarioAdminResponse;
import br.com.infocedro.promocontrol.infra.security.AuthUserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthUserService authUserService;

    public AuthController(AuthUserService authUserService) {
        this.authUserService = authUserService;
    }

    @GetMapping("/sessao")
    public SessaoUsuarioResponse sessao(Authentication authentication) {
        String username = authentication.getName();
        return new SessaoUsuarioResponse(
                username,
                resolvePerfil(authentication),
                authUserService.isPasswordChangeRequired(username));
    }

    @PostMapping("/alterar-senha")
    public void alterarSenha(
            Authentication authentication,
            @Valid @RequestBody AlterarSenhaRequest request) {
        authUserService.changePassword(authentication.getName(), request.novaSenha());
    }

    @PostMapping("/admin/resetar-senha")
    public ResetarSenhaUsuarioResponse resetarSenhaPorAdmin(
            @Valid @RequestBody ResetarSenhaUsuarioRequest request) {
        String temporaryPassword = authUserService.resetPasswordAsTemporary(request.username());
        return new ResetarSenhaUsuarioResponse(request.username(), temporaryPassword);
    }

    @GetMapping("/admin/usuarios")
    public List<UsuarioAdminResponse> listarUsuarios() {
        return authUserService.listUsers()
                .stream()
                .map(u -> new UsuarioAdminResponse(
                        u.username(),
                        u.codigo(),
                        u.perfil(),
                        u.status(),
                        u.mustChangePassword()))
                .toList();
    }

    @PostMapping("/admin/usuarios")
    public CriarUsuarioResponse criarUsuario(@Valid @RequestBody CriarUsuarioRequest request) {
        AuthUserService.CreatedUser created =
                authUserService.createUserByAdmin(request.username(), request.perfil(), request.status());
        return new CriarUsuarioResponse(
                created.username(),
                created.codigo(),
                created.perfil(),
                created.status(),
                created.temporaryPassword());
    }

    @PatchMapping("/admin/usuarios/{username}")
    public UsuarioAdminResponse atualizarUsuario(
            @PathVariable String username,
            @Valid @RequestBody AtualizarUsuarioRequest request) {
        AuthUserService.UserSummary updated =
                authUserService.updateUserByAdmin(
                        username,
                        request.username(),
                        request.perfil(),
                        request.status());
        return new UsuarioAdminResponse(
                updated.username(),
                updated.codigo(),
                updated.perfil(),
                updated.status(),
                updated.mustChangePassword());
    }

    @DeleteMapping("/admin/usuarios/{username}")
    public void excluirUsuario(
            @PathVariable String username,
            Authentication authentication) {
        authUserService.deleteUserByAdmin(username, authentication.getName());
    }

    private String resolvePerfil(Authentication authentication) {
        Set<String> authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toSet());

        if (authorities.contains("ROLE_ADMIN")) {
            return "ADMIN";
        }
        if (authorities.contains("ROLE_GESTOR")) {
            return "GESTOR";
        }
        if (authorities.contains("ROLE_OPERATOR")) {
            return "OPERATOR";
        }
        return "VIEWER";
    }
}
