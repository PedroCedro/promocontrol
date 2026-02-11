package br.com.infocedro.promocontrol.core.repository;

import br.com.infocedro.promocontrol.core.model.Promotor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PromotorRepository extends JpaRepository<Promotor, UUID> {
}