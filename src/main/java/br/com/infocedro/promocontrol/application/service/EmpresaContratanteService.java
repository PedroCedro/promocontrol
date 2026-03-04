package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.EmpresaContratanteFornecedorJaVinculadoException;
import br.com.infocedro.promocontrol.core.exception.EmpresaContratanteNaoEncontradaException;
import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.model.EmpresaContratante;
import br.com.infocedro.promocontrol.core.repository.EmpresaContratanteRepository;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EmpresaContratanteService {

    private final EmpresaContratanteRepository repository;
    private final FornecedorRepository fornecedorRepository;

    public EmpresaContratanteService(
            EmpresaContratanteRepository repository,
            FornecedorRepository fornecedorRepository) {
        this.repository = repository;
        this.fornecedorRepository = fornecedorRepository;
    }

    @Transactional
    public EmpresaContratante criar(EmpresaContratante empresa) {
        if (!fornecedorRepository.existsById(empresa.getFornecedorId())) {
            throw new FornecedorNaoEncontradoException();
        }
        if (repository.existsByFornecedorId(empresa.getFornecedorId())) {
            throw new EmpresaContratanteFornecedorJaVinculadoException();
        }
        if (empresa.getCodigo() == null) {
            Integer ultimoCodigo = repository.findTopByOrderByCodigoDesc()
                    .map(EmpresaContratante::getCodigo)
                    .orElse(0);
            empresa.setCodigo(ultimoCodigo + 1);
        }
        if (empresa.getAtivo() == null) {
            empresa.setAtivo(true);
        }
        return repository.save(empresa);
    }

    public List<EmpresaContratante> listar() {
        return repository.findAll();
    }

    public EmpresaContratante buscarPorId(Integer id) {
        return repository.findById(id).orElseThrow(EmpresaContratanteNaoEncontradaException::new);
    }

    @Transactional
    public EmpresaContratante atualizar(Integer id, EmpresaContratante dados) {
        EmpresaContratante atual = buscarPorId(id);
        atual.setNome(dados.getNome());
        atual.setCnpj(dados.getCnpj());
        atual.setEmail(dados.getEmail());
        atual.setTelefone(dados.getTelefone());
        atual.setUf(dados.getUf());
        atual.setAtivo(dados.getAtivo());
        return repository.save(atual);
    }

    @Transactional
    public void excluir(Integer id) {
        EmpresaContratante empresa = buscarPorId(id);
        repository.delete(empresa);
    }
}
