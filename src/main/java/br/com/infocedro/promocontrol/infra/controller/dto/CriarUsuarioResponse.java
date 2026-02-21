package br.com.infocedro.promocontrol.infra.controller.dto;

public record CriarUsuarioResponse(
        String username,
        Integer codigo,
        String perfil,
        String status,
        String senhaTemporaria) {
}
