package br.com.infocedro.promocontrol.infra.security;

import br.com.infocedro.promocontrol.core.model.Usuario;
import br.com.infocedro.promocontrol.core.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserAccessScopeService {

    private final UsuarioRepository usuarioRepository;

    public UserAccessScopeService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public UserScope resolveScope(String username) {
        Usuario usuario = usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Usuario nao encontrado"));
        Integer fornecedorId = usuario.getFornecedor() != null ? usuario.getFornecedor().getId() : null;
        String fornecedorNome = usuario.getFornecedor() != null ? usuario.getFornecedor().getNome() : null;
        boolean fornecedorScoped = "FORNECEDOR".equalsIgnoreCase(usuario.getPerfil()) && fornecedorId != null;
        return new UserScope(usuario.getUsername(), usuario.getPerfil(), fornecedorId, fornecedorNome, fornecedorScoped);
    }

    public record UserScope(
            String username,
            String perfil,
            Integer fornecedorId,
            String fornecedorNome,
            boolean fornecedorScoped) {
    }
}
