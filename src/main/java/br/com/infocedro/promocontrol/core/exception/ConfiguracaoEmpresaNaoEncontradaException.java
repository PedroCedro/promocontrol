package br.com.infocedro.promocontrol.core.exception;

public class ConfiguracaoEmpresaNaoEncontradaException extends NotFoundBusinessException {

    public ConfiguracaoEmpresaNaoEncontradaException(Integer empresaId) {
        super("Configuracao da empresa " + empresaId + " nao encontrada");
    }
}
