package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.exception.PromotorNaoEncontradoException;
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
public class PromotorService {

    private final PromotorRepository repository;
    private final FornecedorRepository fornecedorRepository;
    private final MovimentoPromotorRepository movimentoRepository;

    public PromotorService(
            PromotorRepository repository,
            FornecedorRepository fornecedorRepository,
            MovimentoPromotorRepository movimentoRepository) {
        this.repository = repository;
        this.fornecedorRepository = fornecedorRepository;
        this.movimentoRepository = movimentoRepository;
    }

    @Transactional
    public Promotor salvar(Promotor promotor, Integer fornecedorId) {
        Fornecedor fornecedor = fornecedorRepository.findById(fornecedorId)
                .orElseThrow(FornecedorNaoEncontradoException::new);
        if (promotor.getCodigo() == null) {
            Integer ultimoCodigo = repository.findTopByOrderByCodigoDesc()
                    .map(Promotor::getCodigo)
                    .orElse(0);
            promotor.setCodigo(ultimoCodigo + 1);
        }
        promotor.setFornecedor(fornecedor);
        return repository.save(promotor);
    }

    public List<Promotor> listar() {
        return repository.findAll();
    }

    @Transactional
    public Promotor atualizar(UUID id, Promotor promotorAtualizado, Integer fornecedorId) {
        Promotor existente = repository.findById(id)
                .orElseThrow(PromotorNaoEncontradoException::new);
        Fornecedor fornecedor = fornecedorRepository.findById(fornecedorId)
                .orElseThrow(FornecedorNaoEncontradoException::new);

        existente.setNome(promotorAtualizado.getNome());
        existente.setTelefone(promotorAtualizado.getTelefone());
        existente.setStatus(promotorAtualizado.getStatus());
        existente.setFotoPath(promotorAtualizado.getFotoPath());
        existente.setFornecedor(fornecedor);

        return repository.save(existente);
    }

    @Transactional
    public void excluir(UUID id) {
        Promotor promotor = repository.findById(id)
                .orElseThrow(PromotorNaoEncontradoException::new);
        movimentoRepository.deleteByPromotor_Id(promotor.getId());
        repository.delete(promotor);
    }

}
