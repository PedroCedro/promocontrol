package br.com.infocedro.promocontrol.core.exception;

public class FornecedorNaoEncontradoException extends NotFoundBusinessException {

    public FornecedorNaoEncontradoException() {
        super("Fornecedor nao encontrado");
    }
}
