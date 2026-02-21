package br.com.infocedro.promocontrol.core.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "USUARIO")
public class Usuario extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String username;

    @Column(nullable = false, unique = true)
    private Integer codigo;

    @Column(nullable = false, length = 255)
    private String senhaHash;

    @Column(nullable = false, length = 20)
    private String perfil;

    @Column(nullable = false)
    private boolean precisaTrocarSenha;

    @Column(nullable = false)
    private boolean ativo;
}
