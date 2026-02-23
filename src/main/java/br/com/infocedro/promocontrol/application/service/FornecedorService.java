package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.MovimentoPromotorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class FornecedorService {

    private static final String FORNECEDOR_SISTEMA_NOME = "Fornecedor nao informado";

    private final FornecedorRepository repository;
    private final PromotorRepository promotorRepository;
    private final MovimentoPromotorRepository movimentoRepository;

    public FornecedorService(
            FornecedorRepository repository,
            PromotorRepository promotorRepository,
            MovimentoPromotorRepository movimentoRepository) {
        this.repository = repository;
        this.promotorRepository = promotorRepository;
        this.movimentoRepository = movimentoRepository;
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
        List<UUID> promotorIds = promotorRepository.findByFornecedor_Id(id).stream()
                .map(Promotor::getId)
                .toList();
        if (!promotorIds.isEmpty()) {
            movimentoRepository.deleteByPromotor_IdIn(promotorIds);
            promotorRepository.deleteByFornecedor_Id(id);
        }
        repository.delete(fornecedor);
    }
}
