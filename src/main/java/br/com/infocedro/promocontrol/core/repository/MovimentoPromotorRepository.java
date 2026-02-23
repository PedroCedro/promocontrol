package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.MovimentoPromotor;
import br.com.infocedro.promocontrol.core.model.TipoMovimentoPromotor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimentoPromotorRepository extends JpaRepository<MovimentoPromotor, UUID> {
    Optional<MovimentoPromotor> findTopByPromotor_IdOrderByDataHoraDescIdDesc(UUID promotorId);

    long countByPromotor_IdAndTipo(UUID promotorId, TipoMovimentoPromotor tipo);

    List<MovimentoPromotor> findByPromotor_IdInAndDataHoraBetween(
            List<UUID> promotorIds,
            LocalDateTime inicio,
            LocalDateTime fim);

    long countByPromotor_IdInAndTipoAndDataHoraBetween(
            List<UUID> promotorIds,
            TipoMovimentoPromotor tipo,
            LocalDateTime inicio,
            LocalDateTime fim);

    void deleteByPromotor_Id(UUID promotorId);

    void deleteByPromotor_IdIn(List<UUID> promotorIds);
}
