package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.ConfiguracaoEmpresaJaExisteException;
import br.com.infocedro.promocontrol.core.exception.ConfiguracaoEmpresaNaoEncontradaException;
import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.model.ConfiguracaoEmpresa;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.ConfiguracaoEmpresaRepository;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ConfiguracaoEmpresaService {

    private final ConfiguracaoEmpresaRepository repository;
    private final FornecedorRepository fornecedorRepository;

    public ConfiguracaoEmpresaService(
            ConfiguracaoEmpresaRepository repository,
            FornecedorRepository fornecedorRepository) {
        this.repository = repository;
        this.fornecedorRepository = fornecedorRepository;
    }

    @Transactional
    public ConfiguracaoEmpresa criar(Integer empresaId, ConfiguracaoEmpresa dados) {
        Fornecedor empresa = buscarEmpresa(empresaId);
        if (repository.existsByEmpresa_Id(empresaId)) {
            throw new ConfiguracaoEmpresaJaExisteException(empresaId);
        }

        ConfiguracaoEmpresa configuracao = ConfiguracaoEmpresa.padrao(empresa);
        configuracao.aplicarParametros(
                dados.getEncerramentoAutomaticoHabilitado(),
                dados.getHorarioEncerramentoAutomatico(),
                dados.getTextoObservacaoEncerramentoAutomatico(),
                dados.getPermitirMultiplasEntradasNoDia(),
                dados.getExigirFotoNaEntrada());
        return repository.save(configuracao);
    }

    public ConfiguracaoEmpresa buscarPorEmpresaId(Integer empresaId) {
        return repository.findByEmpresa_Id(empresaId)
                .orElseThrow(() -> new ConfiguracaoEmpresaNaoEncontradaException(empresaId));
    }

    @Transactional
    public ConfiguracaoEmpresa atualizar(Integer empresaId, ConfiguracaoEmpresa dados) {
        ConfiguracaoEmpresa atual = buscarPorEmpresaId(empresaId);
        atual.aplicarParametros(
                dados.getEncerramentoAutomaticoHabilitado(),
                dados.getHorarioEncerramentoAutomatico(),
                dados.getTextoObservacaoEncerramentoAutomatico(),
                dados.getPermitirMultiplasEntradasNoDia(),
                dados.getExigirFotoNaEntrada());
        return repository.save(atual);
    }

    @Transactional
    public ConfiguracaoEmpresa redefinirParaPadrao(Integer empresaId) {
        Fornecedor empresa = buscarEmpresa(empresaId);
        repository.findByEmpresa_Id(empresaId).ifPresent(repository::delete);
        repository.flush();
        return repository.save(ConfiguracaoEmpresa.padrao(empresa));
    }

    private Fornecedor buscarEmpresa(Integer empresaId) {
        return fornecedorRepository.findById(empresaId)
                .orElseThrow(FornecedorNaoEncontradoException::new);
    }
}
