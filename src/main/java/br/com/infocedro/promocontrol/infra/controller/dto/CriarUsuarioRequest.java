package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CriarUsuarioRequest(
        @NotBlank String username,
        @NotBlank
        @Pattern(regexp = "VIEWER|OPERATOR|ADMIN", message = "perfil deve ser VIEWER, OPERATOR ou ADMIN")
        String perfil) {
}
