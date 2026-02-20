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
    private final String defaultAdminUsername;
    private final String defaultAdminPassword;

    public AuthUserService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.user.username:user}") String userUsername,
            @Value("${app.security.user.password:user123}") String userPassword,
            @Value("${app.security.viewer.username:viewer}") String viewerUsername,
            @Value("${app.security.viewer.password:viewer123}") String viewerPassword,
            @Value("${app.security.admin.username:admin}") String adminUsername,
            @Value("${app.security.admin.password:admin123}") String adminPassword) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultUserUsername = userUsername;
        this.defaultUserPassword = userPassword;
        this.defaultViewerUsername = viewerUsername;
        this.defaultViewerPassword = viewerPassword;
        this.defaultAdminUsername = adminUsername;
        this.defaultAdminPassword = adminPassword;
    }

    @PostConstruct
    @Transactional
    public void initializeDefaults() {
        createDefaultUserIfMissing(defaultViewerUsername, defaultViewerPassword, "VIEWER");
        createDefaultUserIfMissing(defaultUserUsername, defaultUserPassword, "OPERATOR");
        createDefaultUserIfMissing(defaultAdminUsername, defaultAdminPassword, "ADMIN");
    }

    private void createDefaultUserIfMissing(String username, String rawPassword, String perfil) {
        if (username == null || username.isBlank()) return;
        if (usuarioRepository.existsByUsername(username)) return;

        Usuario user = new Usuario();
        user.setUsername(username);
        user.setSenhaHash(passwordEncoder.encode(rawPassword));
        user.setPerfil(perfil);
        user.setPrecisaTrocarSenha(false);
        usuarioRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario user = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario nao encontrado"));

        return User.withUsername(user.getUsername())
                .password(user.getSenhaHash())
                .roles(resolveRoles(user.getPerfil()).toArray(String[]::new))
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
    public CreatedUser createUserByAdmin(String username, String perfil) {
        if (usuarioRepository.existsByUsername(username)) {
            throw new UsuarioJaExisteException();
        }

        RoleSetup roleSetup = resolveRoleSetup(perfil);
        String temporaryPassword = generateTemporaryPassword(10);

        Usuario newUser = new Usuario();
        newUser.setUsername(username);
        newUser.setPerfil(roleSetup.perfil());
        newUser.setSenhaHash(passwordEncoder.encode(temporaryPassword));
        newUser.setPrecisaTrocarSenha(true);
        usuarioRepository.save(newUser);

        return new CreatedUser(username, roleSetup.perfil(), temporaryPassword);
    }

    public List<UserSummary> listUsers() {
        return usuarioRepository.findAllByOrderByUsernameAsc().stream()
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
                user.getPerfil(),
                user.isPrecisaTrocarSenha());
    }

    private RoleSetup resolveRoleSetup(String perfil) {
        return switch (perfil) {
            case "ADMIN" -> new RoleSetup("ADMIN", List.of("ADMIN", "OPERATOR", "VIEWER"));
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

    public record CreatedUser(String username, String perfil, String temporaryPassword) {
    }

    public record UserSummary(String username, String perfil, boolean mustChangePassword) {
    }
}
