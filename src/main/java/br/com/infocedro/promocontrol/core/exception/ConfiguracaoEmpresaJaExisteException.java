package br.com.infocedro.promocontrol.core.exception;

public class ConfiguracaoEmpresaJaExisteException extends BadRequestBusinessException {

    public ConfiguracaoEmpresaJaExisteException(Integer empresaId) {
        super("Empresa " + empresaId + " ja possui configuracao cadastrada");
    }
}
