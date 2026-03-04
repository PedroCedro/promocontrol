package br.com.infocedro.promocontrol.core.exception;

public class EmpresaContratanteNaoEncontradaException extends NotFoundBusinessException {
    public EmpresaContratanteNaoEncontradaException() {
        super("Empresa contratante nao encontrada");
    }
}

