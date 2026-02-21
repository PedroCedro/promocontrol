package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AtualizarUsuarioRequest(
        @NotBlank String username,
        @NotBlank
        @Pattern(regexp = "VIEWER|OPERATOR|GESTOR|ADMIN", message = "perfil deve ser VIEWER, OPERATOR, GESTOR ou ADMIN")
        String perfil,
        @NotBlank
        @Pattern(regexp = "ATIVO|INATIVO", message = "status deve ser ATIVO ou INATIVO")
        String status) {
}
