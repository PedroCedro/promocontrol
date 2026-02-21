package br.com.infocedro.promocontrol.infra.security;

import br.com.infocedro.promocontrol.core.exception.UsuarioNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.UsuarioJaExisteException;
import br.com.infocedro.promocontrol.core.model.Usuario;
import br.com.infocedro.promocontrol.core.repository.UsuarioRepository;
import java.security.SecureRandom;
import java.util.List;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthUserService implements UserDetailsService {

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String defaultUserUsername;
    private final String defaultUserPassword;
    private final String defaultViewerUsername;
    private final String defaultViewerPassword;
    private final String defaultGestorUsername;
    private final String defaultGestorPassword;
    private final String defaultAdminUsername;
    private final String defaultAdminPassword;

    public AuthUserService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.user.username:user}") String userUsername,
            @Value("${app.security.user.password:user123}") String userPassword,
            @Value("${app.security.viewer.username:viewer}") String viewerUsername,
            @Value("${app.security.viewer.password:viewer123}") String viewerPassword,
            @Value("${app.security.gestor.username:gestor}") String gestorUsername,
            @Value("${app.security.gestor.password:gestor123}") String gestorPassword,
            @Value("${app.security.admin.username:admin}") String adminUsername,
            @Value("${app.security.admin.password:admin123}") String adminPassword) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultUserUsername = userUsername;
        this.defaultUserPassword = userPassword;
        this.defaultViewerUsername = viewerUsername;
        this.defaultViewerPassword = viewerPassword;
        this.defaultGestorUsername = gestorUsername;
        this.defaultGestorPassword = gestorPassword;
        this.defaultAdminUsername = adminUsername;
        this.defaultAdminPassword = adminPassword;
    }

    @PostConstruct
    @Transactional
    public void initializeDefaults() {
        createDefaultUserIfMissing(defaultViewerUsername, defaultViewerPassword, "VIEWER");
        createDefaultUserIfMissing(defaultUserUsername, defaultUserPassword, "OPERATOR");
        createDefaultUserIfMissing(defaultGestorUsername, defaultGestorPassword, "GESTOR");
        createDefaultUserIfMissing(defaultAdminUsername, defaultAdminPassword, "ADMIN");
        ensureUserCodes();
    }

    private void createDefaultUserIfMissing(String username, String rawPassword, String perfil) {
        if (username == null || username.isBlank()) return;
        if (usuarioRepository.existsByUsername(username)) return;

        Usuario user = new Usuario();
        user.setUsername(username);
        user.setCodigo(nextUserCode());
        user.setSenhaHash(passwordEncoder.encode(rawPassword));
        user.setPerfil(perfil);
        user.setPrecisaTrocarSenha(false);
        user.setAtivo(true);
        usuarioRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario user = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado"));

        return User.withUsername(user.getUsername())
                .password(user.getSenhaHash())
                .roles(resolveRoles(user.getPerfil()).toArray(String[]::new))
                .disabled(!user.isAtivo())
                .build();
    }

    public boolean isPasswordChangeRequired(String username) {
        return usuarioRepository.findByUsername(username)
                .map(Usuario::isPrecisaTrocarSenha)
                .orElse(false);
    }

    @Transactional
    public void changePassword(String username, String newRawPassword) {
        Usuario user = getRequiredUser(username);
        user.setSenhaHash(passwordEncoder.encode(newRawPassword));
        user.setPrecisaTrocarSenha(false);
        usuarioRepository.save(user);
    }

    @Transactional
    public String resetPasswordAsTemporary(String username) {
        Usuario user = getRequiredUser(username);
        String temporaryPassword = generateTemporaryPassword(10);
        user.setSenhaHash(passwordEncoder.encode(temporaryPassword));
        user.setPrecisaTrocarSenha(true);
        usuarioRepository.save(user);
        return temporaryPassword;
    }

    @Transactional
    public CreatedUser createUserByAdmin(String username, String perfil, String status) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new UsuarioJaExisteException();
        }

        RoleSetup roleSetup = resolveRoleSetup(perfil);
        String temporaryPassword = generateTemporaryPassword(10);

        Usuario newUser = new Usuario();
        newUser.setUsername(username);
        newUser.setCodigo(nextUserCode());
        newUser.setPerfil(roleSetup.perfil());
        newUser.setSenhaHash(passwordEncoder.encode(temporaryPassword));
        newUser.setPrecisaTrocarSenha(true);
        newUser.setAtivo(resolveAtivo(status));
        usuarioRepository.save(newUser);

        return new CreatedUser(
                username,
                newUser.getCodigo(),
                roleSetup.perfil(),
                resolveStatus(newUser.isAtivo()),
                temporaryPassword);
    }

    @Transactional
    public UserSummary updateUserByAdmin(String currentUsername, String newUsername, String perfil, String status) {
        Usuario user = getRequiredUser(currentUsername);
        String normalizedNewUsername = newUsername == null ? "" : newUsername.trim();
        if (!user.getUsername().equals(normalizedNewUsername) && usuarioRepository.existsByUsername(normalizedNewUsername)) {
            throw new UsuarioJaExisteException();
        }
        user.setUsername(normalizedNewUsername);
        RoleSetup roleSetup = resolveRoleSetup(perfil);
        user.setPerfil(roleSetup.perfil());
        user.setAtivo(resolveAtivo(status));
        usuarioRepository.save(user);
        return toSummary(user);
    }

    public List<UserSummary> listUsers() {
        return usuarioRepository.findAllByOrderByCodigoAsc().stream()
                .map(this::toSummary)
                .toList();
    }

    private Usuario getRequiredUser(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(UsuarioNaoEncontradoException::new);
    }

    private UserSummary toSummary(Usuario user) {
        return new UserSummary(
                user.getUsername(),
                user.getCodigo(),
                user.getPerfil(),
                resolveStatus(user.isAtivo()),
                user.isPrecisaTrocarSenha());
    }

    @Transactional
    protected void ensureUserCodes() {
        List<Usuario> semCodigo = usuarioRepository.findAllByCodigoIsNullOrderByUsernameAsc();
        if (semCodigo.isEmpty()) return;
        int next = nextUserCode();
        for (Usuario user : semCodigo) {
            user.setCodigo(next++);
            usuarioRepository.save(user);
        }
    }

    private int nextUserCode() {
        return usuarioRepository.findTopByOrderByCodigoDesc()
                .map(Usuario::getCodigo)
                .map(codigo -> codigo + 1)
                .orElse(1);
    }

    private boolean resolveAtivo(String status) {
        return !"INATIVO".equalsIgnoreCase(status);
    }

    private String resolveStatus(boolean ativo) {
        return ativo ? "ATIVO" : "INATIVO";
    }

    private RoleSetup resolveRoleSetup(String perfil) {
        return switch (perfil) {
            case "ADMIN" -> new RoleSetup("ADMIN", List.of("ADMIN", "GESTOR", "OPERATOR", "VIEWER"));
            case "GESTOR" -> new RoleSetup("GESTOR", List.of("GESTOR", "VIEWER"));
            case "OPERATOR" -> new RoleSetup("OPERATOR", List.of("OPERATOR", "VIEWER"));
            default -> new RoleSetup("VIEWER", List.of("VIEWER"));
        };
    }

    private List<String> resolveRoles(String perfil) {
        return resolveRoleSetup(perfil).roles();
    }

    private String generateTemporaryPassword(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = secureRandom.nextInt(TEMP_PASSWORD_CHARS.length());
            builder.append(TEMP_PASSWORD_CHARS.charAt(index));
        }
        return builder.toString();
    }

    private record RoleSetup(String perfil, List<String> roles) {
    }

    public record CreatedUser(String username, Integer codigo, String perfil, String status, String temporaryPassword) {
    }

    public record UserSummary(String username, Integer codigo, String perfil, String status, boolean mustChangePassword) {
    }
}
