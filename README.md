# PromoControl

Sistema web para **controle de acesso e movimento diário de promotores**, integrado ao ecossistema Winthor.
Projeto desenvolvido com foco em resolver dores reais de operação de loja, substituindo controles manuais em planilhas por uma API segura e estruturada.

---

## Objetivo

Registrar e gerenciar:

* Cadastro de promotores
* Entrada e saída diária
* Responsáveis pela autorização
* Integração futura com usuários do Winthor (PCEMPR)

---

## Arquitetura

O projeto segue uma estrutura em camadas:

```
core        → domínio (modelos e repositórios)
application → regras de negócio (services)
infra       → controllers e configurações
```

Stack utilizada:

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* H2 Database (desenvolvimento)
* Maven

---

## Como rodar o projeto

### Pré-requisitos

* JDK 21 instalado
* Maven Wrapper (já incluso)

### Executar

```bash
./mvnw spring-boot:run
```

Aplicação sobe em:

```
http://localhost:8080
```

---

## Autenticação

O projeto utiliza **Basic Auth** via Spring Security.

Usuário padrão (modo dev):

```
user
```

A senha é gerada automaticamente no console ao iniciar a aplicação.

---

## Endpoints atuais

### Criar Promotor

```
POST /promotores
```

Body:

```json
{
  "nome": "Promotor Teste",
  "telefone": "123456789",
  "fornecedorId": 123,
  "status": "ATIVO",
  "fotoPath": ""
}
```

---

### Listar Promotores

```
GET /promotores
```

---

## Roadmap

Próximos passos planejados:

* [ ] Entrada e saída de promotor
* [ ] Integração com PCEMPR (usuário logado)
* [ ] Upload de foto
* [ ] Status lógico (bloqueado/inativo)
* [ ] Dashboard de movimento do dia

---

## Autor

Projeto idealizado por **Pedro Cedro**
InfoCedro Software

---

## Versão

`v0.1.0` – Estrutura inicial do PromoControl com API de Promotores, autenticação básica e persistência.
