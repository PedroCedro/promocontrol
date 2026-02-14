package br.com.infocedro.promocontrol.core.model;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "PROMOTOR")
public class Promotor extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Version
    private Long version;

    private String nome;

    private String telefone;

    @Column(name = "empresa_id")
    private Integer empresaId; // identificador interno da empresa/parceiro

    @Enumerated(EnumType.STRING)
    private StatusPromotor status;

    private String fotoPath;

    public Promotor() {}
}
