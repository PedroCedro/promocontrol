package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CriarUsuarioRequest(
        @NotBlank String username,
        @NotBlank
        @Pattern(regexp = "VIEWER|OPERATOR|GESTOR|ADMIN|FORNECEDOR", message = "perfil deve ser VIEWER, OPERATOR, GESTOR, ADMIN ou FORNECEDOR")
        String perfil,
        @NotBlank
        @Pattern(regexp = "ATIVO|INATIVO", message = "status deve ser ATIVO ou INATIVO")
        String status,
        Boolean acessaWeb,
        Boolean acessaMobile,
        Integer fornecedorId) {
}
