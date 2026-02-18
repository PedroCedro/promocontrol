package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Fornecedor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Integer> {
}
