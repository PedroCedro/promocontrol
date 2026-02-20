package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Fornecedor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Integer> {
    Optional<Fornecedor> findTopByOrderByCodigoDesc();
}
