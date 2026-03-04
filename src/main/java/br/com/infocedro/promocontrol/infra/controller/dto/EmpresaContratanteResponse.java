package br.com.infocedro.promocontrol.infra.controller.dto;

public record EmpresaContratanteResponse(
        Integer id,
        Integer codigo,
        String nome,
        String cnpj,
        String email,
        String telefone,
        String uf,
        Boolean ativo,
        Integer fornecedorId) {
}

