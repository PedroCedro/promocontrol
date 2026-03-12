package br.com.infocedro.promocontrol.core.exception;

public class UsuarioFornecedorObrigatorioException extends BadRequestBusinessException {

    public UsuarioFornecedorObrigatorioException() {
        super("Fornecedor vinculado obrigatorio para perfil FORNECEDOR");
    }
}
