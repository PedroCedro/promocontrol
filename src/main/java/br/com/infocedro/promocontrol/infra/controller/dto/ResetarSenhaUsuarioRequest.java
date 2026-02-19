package br.com.infocedro.promocontrol.infra.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetarSenhaUsuarioRequest(@NotBlank String username) {
}
