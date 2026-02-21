package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Usuario;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Usuario> findAllByOrderByUsernameAsc();

    List<Usuario> findAllByOrderByCodigoAsc();

    List<Usuario> findAllByCodigoIsNullOrderByUsernameAsc();

    Optional<Usuario> findTopByOrderByCodigoDesc();
}
