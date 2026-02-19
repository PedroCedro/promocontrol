package br.com.infocedro.promocontrol.infra.controller.dto;

public record UsuarioAdminResponse(
        String username,
        String perfil,
        boolean precisaTrocarSenha) {
}
