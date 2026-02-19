# PromoControl
**Controle inteligente de acesso e movimento diário de promotores**

Sistema web para **controle de acesso e movimento diário de promotores**.
Projeto desenvolvido com foco em resolver dores reais de operação de loja, substituindo controles manuais em planilhas por uma API segura e estruturada.

---

## Objetivo

Registrar e gerenciar:

* Cadastro de promotores
* Entrada e saída diária
* Responsáveis pela autorização
* Rastreabilidade e consistência do fluxo operacional

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

Executar com perfil especifico:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=homolog
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

Aplicação sobe em:

```
http://localhost:8080
```

Documentacao OpenAPI/Swagger:

```
http://localhost:8080/swagger-ui/index.html
```

Front temporario para validacao manual:

```
http://localhost:8080/front-temp/index.html
```

Healthcheck e info:

```
http://localhost:8080/actuator/health
http://localhost:8080/actuator/info
```

---

## Autenticação

O projeto utiliza **Basic Auth** via Spring Security.

Usuários padrão (modo dev):

```
user / user123
viewer / viewer123
admin / admin123
```

As credenciais podem ser sobrescritas por variáveis de ambiente:

```
APP_SECURITY_USER_USERNAME
APP_SECURITY_USER_PASSWORD
APP_SECURITY_VIEWER_USERNAME
APP_SECURITY_VIEWER_PASSWORD
APP_SECURITY_ADMIN_USERNAME
APP_SECURITY_ADMIN_PASSWORD
```

Origem CORS permitida (front):

```
APP_CORS_ALLOWED_ORIGINS
```

Valor padrao em dev: `http://localhost:3000,http://127.0.0.1:3000`.

Cabecalho de correlacao para rastreio de requisicoes:

```
APP_CORRELATION_HEADER
```

Padrao: `X-Correlation-Id`.

Perfis de acesso:

* `VIEWER`: leitura (`GET`) de promotores, fornecedores, movimentos e dashboards.
* `OPERATOR`: leitura + operacoes de cadastro e movimentos.
* `ADMIN`: mesmas permissoes de operador + ajuste de horario (`PATCH /movimentos/{id}/ajuste-horario`).

Fluxo de senha (v0.5.2.0):

* `ADMIN` pode resetar senha de qualquer usuario via `POST /auth/admin/resetar-senha`.
* O reset retorna uma senha temporaria apenas na resposta da operacao.
* Login com senha temporaria exige troca imediata via `POST /auth/alterar-senha`.
* Enquanto a troca nao for concluida, o sistema bloqueia os demais endpoints.

---

## Endpoints atuais

### CRUD de Fornecedor

```
POST /fornecedores
GET /fornecedores
GET /fornecedores/{id}
PUT /fornecedores/{id}
DELETE /fornecedores/{id}
```

Body (POST/PUT):

```json
{
  "nome": "Fornecedor Exemplo",
  "ativo": true
}
```

---

### Criar Promotor

```
POST /promotores
```

Body:

```json
{
  "nome": "Promotor Teste",
  "telefone": "123456789",
  "fornecedorId": 1,
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
* Apenas promotor com status `ATIVO` pode registrar movimento.

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
  "liberadoPor": "Gerente Loja",
  "observacao": "Saida final"
}
```

Regras:

* A data/hora é gerada no servidor no momento da requisição.
* Não permite saída sem entrada em aberto.
* Apenas promotor com status `ATIVO` pode registrar movimento.
* Campo `liberadoPor` é obrigatório na saída.

---

### Listar Movimentos

```
GET /movimentos
```

---

### Dashboard Principal (Planilha)

```
GET /dashboard/planilha-principal?data=YYYY-MM-DD&fornecedorId={id}&status=ATIVO
```

Retorna cards do dia e linhas da planilha com:

* promotor e fornecedor;
* entrada (horario e usuario);
* saida (se saiu, horario, usuario);
* liberacao da saida (`liberadoPor`).

---

### Dashboard de Cumprimento por Fornecedor

```
GET /dashboard/cumprimento-fornecedores?data=YYYY-MM-DD&percentualMinimo=80
```

Retorna previsto x realizado por fornecedor, percentual de cumprimento e alertas de desvio.

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

### Sessao e senha

```
GET /auth/sessao
POST /auth/alterar-senha
POST /auth/admin/resetar-senha
GET /auth/admin/usuarios
POST /auth/admin/usuarios
```

Body (`POST /auth/alterar-senha`):

```json
{
  "novaSenha": "NovaSenhaSegura123"
}
```

Body (`POST /auth/admin/resetar-senha`):

```json
{
  "username": "user"
}
```

Resposta (`POST /auth/admin/resetar-senha`):

```json
{
  "username": "user",
  "senhaTemporaria": "AbC93kLm2Q"
}
```

Body (`POST /auth/admin/usuarios`):

```json
{
  "username": "novo.usuario",
  "perfil": "OPERATOR"
}
```

Resposta (`POST /auth/admin/usuarios`):

```json
{
  "username": "novo.usuario",
  "perfil": "OPERATOR",
  "senhaTemporaria": "AbC93kLm2Q"
}
```

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
    "fornecedorId": 1,
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
    "liberadoPor": "Gerente Loja",
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
* [x] Melhorias de integridade e auditoria
* [ ] Upload de foto
* [x] Status lógico (bloqueado/inativo)
* [ ] Dashboard de movimento do dia

---

## Pronto Para Front

Checklist de prontidao do backend:

* [x] Contrato de API documentado em OpenAPI/Swagger
* [x] Migracao versionada de banco com Flyway
* [x] Perfis de ambiente (`dev`, `homolog`, `prod`)
* [x] CORS configuravel por variavel de ambiente
* [x] Observabilidade com `/actuator/health` e `/actuator/info`
* [x] Correlacao de requisicoes via `X-Correlation-Id`
* [x] Testes automatizados (`.\mvnw.cmd -q test`)
* [x] Pipeline CI em `.github/workflows/ci.yml`
* [x] Smoke test de API em `scripts/smoke_test.ps1`

Executar smoke test local/homolog:

```powershell
.\scripts\smoke_test.ps1 -BaseUrl "http://localhost:8080"
```

Executar checklist de prontidao para homolog:

```powershell
.\scripts\homolog_readiness_check.ps1 -BaseUrl "http://localhost:8080" -RunSmoke
```

---

## Migração de Banco

As migracoes de schema agora sao versionadas com **Flyway** em:

```
src/main/resources/db/migration
```

A aplicacao executa as migracoes automaticamente na inicializacao.

Para bancos legados com o modelo antigo (campo `empresa_id` em `PROMOTOR`), use a migration `V2__fornecedor_e_relacao_promotor.sql` para normalizacao em `FORNECEDOR`.

Para perfis `homolog` e `prod` (PostgreSQL), configure:

```
APP_DB_URL
APP_DB_USERNAME
APP_DB_PASSWORD
```

---

## Autor

Projeto idealizado por **Pedro Cedro**
InfoCedro Software

---

## Versão

`v0.5.3.0` - Gestao administrativa de usuarios, refinamento visual do front-temp em estilo planilha/ERP, perfil lateral e auto-refresh por deteccao de atualizacoes no backend.
