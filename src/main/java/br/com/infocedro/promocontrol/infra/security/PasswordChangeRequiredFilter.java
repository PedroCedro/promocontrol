package br.com.infocedro.promocontrol.infra.security;

import br.com.infocedro.promocontrol.infra.error.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class PasswordChangeRequiredFilter extends OncePerRequestFilter {

    private final AuthUserService authUserService;
    private final ObjectMapper objectMapper;

    public PasswordChangeRequiredFilter(AuthUserService authUserService, ObjectMapper objectMapper) {
        this.authUserService = authUserService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            filterChain.doFilter(request, response);
            return;
        }

        String username = authentication.getName();
        if (!authUserService.isPasswordChangeRequired(username)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isAllowedPathDuringForcedPasswordChange(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Senha temporaria ativa. Altere sua senha para continuar.",
                request.getRequestURI(),
                List.of());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private boolean isAllowedPathDuringForcedPasswordChange(HttpServletRequest request) {
        String path = request.getServletPath();
        String method = request.getMethod();
        return ("GET".equalsIgnoreCase(method) && "/auth/sessao".equals(path))
                || ("POST".equalsIgnoreCase(method) && "/auth/alterar-senha".equals(path))
                || ("OPTIONS".equalsIgnoreCase(method));
    }
}
