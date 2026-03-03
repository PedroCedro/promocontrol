package br.com.infocedro.promocontrol.core.model;

import br.com.infocedro.promocontrol.core.exception.HorarioEncerramentoAutomaticoObrigatorioException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "CONFIGURACAO_EMPRESA")
public class ConfiguracaoEmpresa extends AuditableEntity {

    public static final String OBSERVACAO_ENCERRAMENTO_PADRAO =
            "Encerramento automatico realizado pelo sistema.";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false, unique = true)
    private Fornecedor empresa;

    @Column(nullable = false)
    private Boolean encerramentoAutomaticoHabilitado;

    private LocalTime horarioEncerramentoAutomatico;

    @Column(length = 255)
    private String textoObservacaoEncerramentoAutomatico;

    @Column(nullable = false)
    private Boolean permitirMultiplasEntradasNoDia;

    @Column(nullable = false)
    private Boolean exigirFotoNaEntrada;

    public ConfiguracaoEmpresa() {
    }

    public static ConfiguracaoEmpresa padrao(Fornecedor empresa) {
        ConfiguracaoEmpresa config = new ConfiguracaoEmpresa();
        config.setEmpresa(empresa);
        config.setEncerramentoAutomaticoHabilitado(false);
        config.setHorarioEncerramentoAutomatico(LocalTime.of(22, 0));
        config.setTextoObservacaoEncerramentoAutomatico(OBSERVACAO_ENCERRAMENTO_PADRAO);
        config.setPermitirMultiplasEntradasNoDia(true);
        config.setExigirFotoNaEntrada(false);
        return config;
    }

    public void aplicarParametros(
            Boolean encerramentoAutomaticoHabilitado,
            LocalTime horarioEncerramentoAutomatico,
            String textoObservacaoEncerramentoAutomatico,
            Boolean permitirMultiplasEntradasNoDia,
            Boolean exigirFotoNaEntrada) {
        this.encerramentoAutomaticoHabilitado = encerramentoAutomaticoHabilitado;
        this.horarioEncerramentoAutomatico = horarioEncerramentoAutomatico;
        this.textoObservacaoEncerramentoAutomatico = normalizarTexto(textoObservacaoEncerramentoAutomatico);
        this.permitirMultiplasEntradasNoDia = permitirMultiplasEntradasNoDia;
        this.exigirFotoNaEntrada = exigirFotoNaEntrada;

        if (Boolean.TRUE.equals(this.encerramentoAutomaticoHabilitado)
                && this.horarioEncerramentoAutomatico == null) {
            throw new HorarioEncerramentoAutomaticoObrigatorioException();
        }
    }

    public boolean permiteMultiplasEntradasNoDia() {
        return Boolean.TRUE.equals(permitirMultiplasEntradasNoDia);
    }

    public boolean exigeFotoNaEntrada() {
        return Boolean.TRUE.equals(exigirFotoNaEntrada);
    }

    public boolean deveEncerrarAutomaticamente(LocalTime horarioAtual) {
        if (!Boolean.TRUE.equals(encerramentoAutomaticoHabilitado) || horarioEncerramentoAutomatico == null) {
            return false;
        }
        return !horarioAtual.isBefore(horarioEncerramentoAutomatico);
    }

    public LocalDateTime calcularDataHoraEncerramento(LocalDate dataBase) {
        LocalTime horario = horarioEncerramentoAutomatico != null
                ? horarioEncerramentoAutomatico
                : LocalTime.of(23, 59, 59);
        return LocalDateTime.of(dataBase, horario);
    }

    public String observacaoEncerramentoAutomatico() {
        if (textoObservacaoEncerramentoAutomatico == null || textoObservacaoEncerramentoAutomatico.isBlank()) {
            return OBSERVACAO_ENCERRAMENTO_PADRAO;
        }
        return textoObservacaoEncerramentoAutomatico;
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        return texto.trim();
    }
}
