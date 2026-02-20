package br.com.infocedro.promocontrol.infra.controller.dto;

public record FornecedorResponse(
        Integer id,
        Integer codigo,
        String nome,
        Boolean ativo) {
}
