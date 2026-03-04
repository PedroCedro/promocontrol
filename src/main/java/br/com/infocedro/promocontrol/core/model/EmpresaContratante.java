package br.com.infocedro.promocontrol.core.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "EMPRESA_CONTRATANTE")
public class EmpresaContratante extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private Integer codigo;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(length = 14)
    private String cnpj;

    @Column(length = 255)
    private String email;

    @Column(length = 40)
    private String telefone;

    @Column(length = 2)
    private String uf;

    @Column(nullable = false)
    private Boolean ativo;

    @Column(name = "fornecedor_id", nullable = false, unique = true)
    private Integer fornecedorId;
}

