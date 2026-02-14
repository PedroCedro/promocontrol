package br.com.infocedro.promocontrol.core.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "MOVIMENTO_PROMOTOR")
public class MovimentoPromotor extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "promotor_id", nullable = false)
    private Promotor promotor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentoPromotor tipo;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Column(length = 120)
    private String responsavel;

    @Column(length = 255)
    private String observacao;

    private LocalDateTime dataHoraOriginal;

    @Column(length = 120)
    private String ajustadoPor;

    private LocalDateTime ajustadoEm;

    @Column(length = 255)
    private String ajusteMotivo;

    public MovimentoPromotor() {}
}
