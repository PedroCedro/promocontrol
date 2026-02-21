package br.com.infocedro.promocontrol.infra.controller.dto;

public record UsuarioAdminResponse(
        String username,
        Integer codigo,
        String perfil,
        String status,
        boolean precisaTrocarSenha) {
}
