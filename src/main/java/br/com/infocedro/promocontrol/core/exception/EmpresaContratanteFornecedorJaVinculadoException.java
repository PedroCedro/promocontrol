package br.com.infocedro.promocontrol.core.exception;

public class EmpresaContratanteFornecedorJaVinculadoException extends BadRequestBusinessException {
    public EmpresaContratanteFornecedorJaVinculadoException() {
        super("Fornecedor ja vinculado a uma empresa contratante");
    }
}

