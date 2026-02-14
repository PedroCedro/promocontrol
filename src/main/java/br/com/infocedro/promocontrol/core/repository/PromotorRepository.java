package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Promotor;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.UUID;

public interface PromotorRepository extends JpaRepository<Promotor, UUID> {

    @Lock(LockModeType.OPTIMISTIC_FORCE_INCREMENT)
    Optional<Promotor> findWithLockById(UUID id);
}
