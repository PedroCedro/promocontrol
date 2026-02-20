package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class FornecedorService {

    private static final String FORNECEDOR_SISTEMA_NOME = "Fornecedor nao informado";

    private final FornecedorRepository repository;

    public FornecedorService(FornecedorRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Fornecedor salvar(Fornecedor fornecedor) {
        if (fornecedor.getCodigo() == null) {
            Integer ultimoCodigo = repository.findTopByNomeNotIgnoreCaseOrderByCodigoDesc(FORNECEDOR_SISTEMA_NOME)
                    .map(Fornecedor::getCodigo)
                    .orElse(0);
            fornecedor.setCodigo(ultimoCodigo + 1);
        }
        return repository.save(fornecedor);
    }

    public List<Fornecedor> listar() {
        return repository.findAll();
    }

    public Fornecedor buscarPorId(Integer id) {
        return repository.findById(id).orElseThrow(FornecedorNaoEncontradoException::new);
    }

    @Transactional
    public Fornecedor atualizar(Integer id, Fornecedor dados) {
        Fornecedor atual = buscarPorId(id);
        atual.setNome(dados.getNome());
        atual.setAtivo(dados.getAtivo());
        return repository.save(atual);
    }

    @Transactional
    public void excluir(Integer id) {
        Fornecedor fornecedor = buscarPorId(id);
        repository.delete(fornecedor);
    }
}
