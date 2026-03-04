package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.EmpresaContratante;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaContratanteRepository extends JpaRepository<EmpresaContratante, Integer> {

    Optional<EmpresaContratante> findTopByOrderByCodigoDesc();

    boolean existsByFornecedorId(Integer fornecedorId);
}

