package br.com.infocedro.promocontrol.infra.controller.dto;

public record ResetarSenhaUsuarioResponse(
        String username,
        String senhaTemporaria) {
}
