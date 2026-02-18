package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.exception.FornecedorNaoEncontradoException;
import br.com.infocedro.promocontrol.core.model.Fornecedor;
import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.repository.FornecedorRepository;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PromotorService {

    private final PromotorRepository repository;
    private final FornecedorRepository fornecedorRepository;

    public PromotorService(
            PromotorRepository repository,
            FornecedorRepository fornecedorRepository) {
        this.repository = repository;
        this.fornecedorRepository = fornecedorRepository;
    }

    @Transactional
    public Promotor salvar(Promotor promotor, Integer fornecedorId) {
        Fornecedor fornecedor = fornecedorRepository.findById(fornecedorId)
                .orElseThrow(FornecedorNaoEncontradoException::new);
        promotor.setFornecedor(fornecedor);
        return repository.save(promotor);
    }

    public List<Promotor> listar() {
        return repository.findAll();
    }

}
