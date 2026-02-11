package br.com.infocedro.promocontrol.core.model;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "PROMOTOR")
public class Promotor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String nome;

    private String telefone;

    private Integer fornecedorId; // referência ao Winthor

    @Enumerated(EnumType.STRING)
    private StatusPromotor status;

    private String fotoPath;

    public Promotor() {}
}
