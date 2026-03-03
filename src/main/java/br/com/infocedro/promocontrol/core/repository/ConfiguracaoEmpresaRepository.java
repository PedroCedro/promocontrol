package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoEmpresaRepository extends JpaRepository<ConfiguracaoEmpresa, Integer> {

    Optional<ConfiguracaoEmpresa> findByEmpresa_Id(Integer empresaId);

    boolean existsByEmpresa_Id(Integer empresaId);

    void deleteByEmpresa_Id(Integer empresaId);
}
