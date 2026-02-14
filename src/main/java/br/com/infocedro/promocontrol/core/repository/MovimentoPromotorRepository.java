package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimentoPromotorRepository extends JpaRepository<MovimentoPromotor, UUID> {
    Optional<MovimentoPromotor> findTopByPromotor_IdOrderByDataHoraDescIdDesc(UUID promotorId);

    long countByPromotor_IdAndTipo(UUID promotorId, TipoMovimentoPromotor tipo);
}
