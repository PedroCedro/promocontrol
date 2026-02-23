package br.com.infocedro.promocontrol.infra.config;

import br.com.infocedro.promocontrol.infra.error.ApiErrorResponse;
import br.com.infocedro.promocontrol.infra.security.PasswordChangeRequiredFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String allowedOrigins;

    private final ObjectMapper objectMapper;
    private final CorrelationIdFilter correlationIdFilter;
    private final PasswordChangeRequiredFilter passwordChangeRequiredFilter;
    private final AuthenticationEntryPoint apiAuthenticationEntryPoint;

    public SecurityConfig(
            ObjectMapper objectMapper,
            CorrelationIdFilter correlationIdFilter,
            PasswordChangeRequiredFilter passwordChangeRequiredFilter) {
        this.objectMapper = objectMapper;
        this.correlationIdFilter = correlationIdFilter;
        this.passwordChangeRequiredFilter = passwordChangeRequiredFilter;
        this.apiAuthenticationEntryPoint = (request, response, authException) ->
                writeSecurityError(
                        response,
                        HttpStatus.UNAUTHORIZED,
                        "Autenticacao obrigatoria",
                        request.getRequestURI());
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // 👈 desativa CSRF pra API
            .addFilterBefore(correlationIdFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(passwordChangeRequiredFilter, BasicAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/promocontrol/**").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/auth/sessao")
                    .hasAnyRole("VIEWER", "OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/auth/alterar-senha")
                    .hasAnyRole("VIEWER", "OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/auth/admin/resetar-senha").hasAnyRole("GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/auth/admin/usuarios").hasAnyRole("GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/auth/admin/usuarios").hasAnyRole("GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/auth/admin/usuarios/**").hasAnyRole("GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/movimentos/*/ajuste-horario").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/fornecedores/**", "/promotores/**", "/movimentos/**", "/dashboard/**")
                    .hasAnyRole("VIEWER", "OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/fornecedores/**", "/promotores/**")
                    .hasAnyRole("OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/movimentos/**")
                    .hasAnyRole("OPERATOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/fornecedores/**")
                    .hasAnyRole("OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/promotores/**")
                    .hasAnyRole("OPERATOR", "GESTOR", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/fornecedores/**")
                    .hasAnyRole("OPERATOR", "GESTOR", "ADMIN")
                .anyRequest().denyAll()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(apiAuthenticationEntryPoint)
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    writeSecurityError(
                        response,
                        HttpStatus.FORBIDDEN,
                        "Acesso negado",
                        request.getRequestURI())))
            .httpBasic(basic -> basic.authenticationEntryPoint(apiAuthenticationEntryPoint));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private void writeSecurityError(
            jakarta.servlet.http.HttpServletResponse response,
            HttpStatus status,
            String message,
            String path) throws IOException {
        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                List.of());

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
