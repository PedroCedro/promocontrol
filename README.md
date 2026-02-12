# PromoControl
**Controle inteligente de acesso de promotores integrado ao Winthor**

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

No Windows (PowerShell):

```powershell
.\mvnw.cmd spring-boot:run
```

Aplicação sobe em:

```
http://localhost:8080
```

---

## Autenticação

O projeto utiliza **Basic Auth** via Spring Security.

Usuários padrão (modo dev):

```
user / user123
admin / admin123
```

As credenciais podem ser sobrescritas por variáveis de ambiente:

```
APP_SECURITY_USER_USERNAME
APP_SECURITY_USER_PASSWORD
APP_SECURITY_ADMIN_USERNAME
APP_SECURITY_ADMIN_PASSWORD
```

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

### Registrar Entrada de Promotor

```
POST /movimentos/entrada
```

Body:

```json
{
  "promotorId": "uuid-do-promotor",
  "responsavel": "Joao",
  "observacao": "Entrada na portaria"
}
```

Regras:

* A data/hora é gerada no servidor no momento da requisição.
* Não permite nova entrada se já existir entrada em aberto.

---

### Registrar Saída de Promotor

```
POST /movimentos/saida
```

Body:

```json
{
  "promotorId": "uuid-do-promotor",
  "responsavel": "Joao",
  "observacao": "Saida final"
}
```

Regras:

* A data/hora é gerada no servidor no momento da requisição.
* Não permite saída sem entrada em aberto.

---

### Listar Movimentos

```
GET /movimentos
```

---

### Ajustar Horário de Movimento (somente ADMIN)

```
PATCH /movimentos/{movimentoId}/ajuste-horario
```

Body:

```json
{
  "novaDataHora": "2026-02-12T08:30:00",
  "motivo": "Correcao por falha de registro"
}
```

Observações:

* Endpoint restrito ao perfil `ADMIN`.
* O sistema registra auditoria do ajuste (`dataHoraOriginal`, `ajustadoPor`, `ajustadoEm`, `ajusteMotivo`).

---

## Exemplos cURL

Considere `http://localhost:8080` e ajuste os UUIDs conforme seu ambiente.

### Criar promotor

```bash
curl -X POST "http://localhost:8080/promotores" \
  -u user:user123 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Promotor Teste",
    "telefone": "123456789",
    "fornecedorId": 123,
    "status": "ATIVO",
    "fotoPath": ""
  }'
```

### Listar promotores

```bash
curl -X GET "http://localhost:8080/promotores" \
  -u user:user123
```

### Registrar entrada

```bash
curl -X POST "http://localhost:8080/movimentos/entrada" \
  -u user:user123 \
  -H "Content-Type: application/json" \
  -d '{
    "promotorId": "UUID_PROMOTOR",
    "responsavel": "Joao",
    "observacao": "Entrada na portaria"
  }'
```

### Registrar saída

```bash
curl -X POST "http://localhost:8080/movimentos/saida" \
  -u user:user123 \
  -H "Content-Type: application/json" \
  -d '{
    "promotorId": "UUID_PROMOTOR",
    "responsavel": "Joao",
    "observacao": "Saida final"
  }'
```

### Listar movimentos

```bash
curl -X GET "http://localhost:8080/movimentos" \
  -u user:user123
```

### Ajustar horário (ADMIN)

```bash
curl -X PATCH "http://localhost:8080/movimentos/UUID_MOVIMENTO/ajuste-horario" \
  -u admin:admin123 \
  -H "Content-Type: application/json" \
  -d '{
    "novaDataHora": "2026-02-12T08:30:00",
    "motivo": "Correcao por falha de registro"
  }'
```

---

## Erros esperados

Formato padrao de erro da API:

```json
{
  "timestamp": "2026-02-12T12:34:56.123-03:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Promotor nao possui entrada em aberto",
  "path": "/movimentos/saida",
  "details": []
}
```

Principais cenarios:

* `400 Bad Request`:
  * dupla entrada em aberto;
  * saida sem entrada em aberto;
  * payload invalido ou JSON mal formatado;
  * motivo ausente no ajuste de horario.
* `401 Unauthorized`: sem credenciais ou credenciais invalidas.
* `403 Forbidden`: usuario autenticado sem permissao (ex.: ajuste de horario sem perfil `ADMIN`).
* `404 Not Found`: promotor ou movimento inexistente.
* `500 Internal Server Error`: erro inesperado nao mapeado.

---

## Roadmap

Próximos passos planejados:

* [x] Entrada e saída de promotor
* [x] Ajuste manual de horário com trilha de auditoria (ADMIN)
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

`v0.2.0` – Fluxo de entrada/saída de promotores com ajuste de horário (ADMIN), padronização de erros e testes iniciais com MockMvc.
