package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.model.StatusPromotor;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.UUID;

public interface PromotorRepository extends JpaRepository<Promotor, UUID> {

    @Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)
    Optional<Promotor> findWithLockById(UUID id);

    List<Promotor> findByFornecedor_Id(Integer fornecedorId);

    List<Promotor> findByStatus(StatusPromotor status);

    List<Promotor> findByFornecedor_IdAndStatus(Integer fornecedorId, StatusPromotor status);

    Optional<Promotor> findTopByOrderByCodigoDesc();

    void deleteByFornecedor_Id(Integer fornecedorId);
}
