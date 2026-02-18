package br.com.infocedro.promocontrol.infra.controller.dto;

public record FornecedorResponse(
        Integer id,
        String nome,
        Boolean ativo) {
}
