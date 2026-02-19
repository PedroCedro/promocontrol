package br.com.infocedro.promocontrol.infra.security;

import br.com.infocedro.promocontrol.core.exception.UsuarioNaoEncontradoException;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthUserService implements UserDetailsService {

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, ManagedUser> users = new ConcurrentHashMap<>();

    public AuthUserService(
            PasswordEncoder passwordEncoder,
            @Value("${app.security.user.username:user}") String userUsername,
            @Value("${app.security.user.password:user123}") String userPassword,
            @Value("${app.security.viewer.username:viewer}") String viewerUsername,
            @Value("${app.security.viewer.password:viewer123}") String viewerPassword,
            @Value("${app.security.admin.username:admin}") String adminUsername,
            @Value("${app.security.admin.password:admin123}") String adminPassword) {
        this.passwordEncoder = passwordEncoder;
        createUser(viewerUsername, viewerPassword, List.of("VIEWER"));
        createUser(userUsername, userPassword, List.of("OPERATOR", "VIEWER"));
        createUser(adminUsername, adminPassword, List.of("ADMIN", "OPERATOR", "VIEWER"));
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        ManagedUser user = users.get(username);
        if (user == null) {
            throw new UsernameNotFoundException("Usuario nao encontrado");
        }

        synchronized (user) {
            return User.withUsername(user.username)
                    .password(user.encodedPassword)
                    .roles(user.roles.toArray(String[]::new))
                    .build();
        }
    }

    public boolean isPasswordChangeRequired(String username) {
        ManagedUser user = users.get(username);
        return user != null && user.mustChangePassword;
    }

    public void changePassword(String username, String newRawPassword) {
        ManagedUser user = getRequiredUser(username);
        synchronized (user) {
            user.encodedPassword = passwordEncoder.encode(newRawPassword);
            user.mustChangePassword = false;
        }
    }

    public String resetPasswordAsTemporary(String username) {
        ManagedUser user = getRequiredUser(username);
        String temporaryPassword = generateTemporaryPassword(10);
        synchronized (user) {
            user.encodedPassword = passwordEncoder.encode(temporaryPassword);
            user.mustChangePassword = true;
        }
        return temporaryPassword;
    }

    private ManagedUser getRequiredUser(String username) {
        ManagedUser user = users.get(username);
        if (user == null) {
            throw new UsuarioNaoEncontradoException();
        }
        return user;
    }

    private void createUser(String username, String rawPassword, List<String> roles) {
        users.put(username, new ManagedUser(
                username,
                List.copyOf(roles),
                passwordEncoder.encode(rawPassword),
                false));
    }

    private String generateTemporaryPassword(int length) {
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = secureRandom.nextInt(TEMP_PASSWORD_CHARS.length());
            builder.append(TEMP_PASSWORD_CHARS.charAt(index));
        }
        return builder.toString();
    }

    private static final class ManagedUser {
        private final String username;
        private final List<String> roles;
        private String encodedPassword;
        private boolean mustChangePassword;

        private ManagedUser(
                String username,
                List<String> roles,
                String encodedPassword,
                boolean mustChangePassword) {
            this.username = username;
            this.roles = roles;
            this.encodedPassword = encodedPassword;
            this.mustChangePassword = mustChangePassword;
        }
    }
}
