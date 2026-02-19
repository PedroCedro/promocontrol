package br.com.infocedro.promocontrol.infra.controller.dto;

public record SessaoUsuarioResponse(
        String username,
        String perfil,
        boolean precisaTrocarSenha) {
}
