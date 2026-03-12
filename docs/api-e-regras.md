# API e Regras

## Autenticacao

O projeto usa Basic Auth com Spring Security.

Usuarios padrao de desenvolvimento:

```text
user / user123
viewer / viewer123
gestor / gestor123
admin / admin123
```

## Perfis

- `VIEWER`: leitura de dominios operacionais e dashboards
- `OPERATOR`: leitura + operacao + cadastros operacionais
- `GESTOR`: leitura + cadastros e usuarios, sem entrada/saida
- `ADMIN`: acesso total, incluindo exclusoes criticas e ajuste de horario
- `FORNECEDOR`: leitura restrita ao proprio escopo de fornecedor

## Endpoints principais

Fornecedores:

```text
POST /fornecedores
GET /fornecedores
GET /fornecedores/{id}
PUT /fornecedores/{id}
DELETE /fornecedores/{id}
```

Promotores:

```text
POST /promotores
GET /promotores
PUT /promotores/{id}
DELETE /promotores/{id}
```

Movimentos:

```text
POST /movimentos/entrada
POST /movimentos/saida
GET /movimentos
DELETE /movimentos/{movimentoId}
PATCH /movimentos/{movimentoId}/ajuste-horario
```

Dashboard:

```text
GET /dashboard/planilha-principal
GET /dashboard/cumprimento-fornecedores
```

Configuracao por empresa:

```text
POST /empresas/{empresaId}/configuracao
GET /empresas/{empresaId}/configuracao
PUT /empresas/{empresaId}/configuracao
DELETE /empresas/{empresaId}/configuracao
```

Empresas contratantes:

```text
POST /empresas-cadastro
GET /empresas-cadastro
GET /empresas-cadastro/{id}
PUT /empresas-cadastro/{id}
DELETE /empresas-cadastro/{id}
```

Sessao e usuarios:

```text
GET /auth/sessao
POST /auth/alterar-senha
POST /auth/admin/resetar-senha
GET /auth/admin/usuarios
POST /auth/admin/usuarios
PATCH /auth/admin/usuarios/{username}
DELETE /auth/admin/usuarios/{username}
```

## Regras operacionais principais

- entrada gera data/hora no servidor
- nao permite dupla entrada em aberto
- nao permite saida sem entrada em aberto
- `liberadoPor` e obrigatorio na saida
- apenas promotor `ATIVO` pode movimentar
- regras por empresa podem bloquear multiplas entradas no dia
- regras por empresa podem exigir foto na entrada
- `ADMIN` pode ajustar horario com motivo e trilha de auditoria

## Erros esperados

Formato padrao:

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

Principais status:

- `400` regra de negocio ou payload invalido
- `401` sem autenticacao
- `403` sem permissao
- `404` recurso nao encontrado
- `500` erro inesperado nao mapeado

## Referencias complementares

- Swagger local: `http://localhost:8080/swagger-ui/index.html`
- Visao tecnica ampla: `Content4You.md`
- Historico de entregas: `CHANGELOG.md`
