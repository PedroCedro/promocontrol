package br.com.infocedro.promocontrol.infra.controller.dto;

public record CriarUsuarioResponse(
        String username,
        String perfil,
        String senhaTemporaria) {
}
