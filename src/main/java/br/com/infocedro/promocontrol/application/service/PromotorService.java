package br.com.infocedro.promocontrol.application.service;

import br.com.infocedro.promocontrol.core.model.Promotor;
import br.com.infocedro.promocontrol.core.repository.PromotorRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PromotorService {

    private final PromotorRepository repository;

    public PromotorService(PromotorRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Promotor salvar(Promotor promotor) {
        return repository.save(promotor);
    }

    public List<Promotor> listar() {
        return repository.findAll();
    }

}
