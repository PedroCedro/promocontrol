# PromoControl

Sistema web para controle operacional de promotores em loja, com backend Spring Boot e frontend estatico integrado ao proprio projeto.

## Resumo

O sistema cobre:

- cadastro de fornecedores, promotores e usuarios
- registro de entrada e saida
- dashboard operacional e acompanhamento por fornecedor
- configuracao por empresa
- seguranca por perfil, auditoria e observabilidade

Arquitetura:

```text
core        -> dominio e repositorios
application -> services e regras de negocio
infra       -> controllers, seguranca e configuracoes
```

Stack principal:

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Flyway
- H2 / PostgreSQL
- Maven

## Inicio rapido

Subir localmente:

```powershell
.\mvnw.cmd spring-boot:run
```

Aplicacao local:

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Front: `http://localhost:8080/promocontrol/index.html`
- Health: `http://localhost:8080/actuator/health`

Gerar o executavel Windows:

```powershell
.\scripts\build_exe.ps1 -SkipTests -CleanDist
```

O `.exe` abre um painel operacional desktop com status do servidor, console de inicializacao e atalho para abrir o front web.

Perfil padrao atual:

```text
prod
```

## Onde encontrar cada informacao

- Execucao, perfis, variaveis e validacao local: [docs/execucao-e-ambiente.md](docs/execucao-e-ambiente.md)
- Migracao da base cadastral H2 para PostgreSQL: [docs/migracao-cadastro-h2-para-postgres.md](docs/migracao-cadastro-h2-para-postgres.md)
- Endpoints, perfis e regras operacionais: [docs/api-e-regras.md](docs/api-e-regras.md)
- Historico de entregas: [CHANGELOG.md](CHANGELOG.md)
- Bootstrap mobile/Capacitor: [mobile/README.md](mobile/README.md)

## Estado atual

Entrega recente consolidada:

- escopo por fornecedor no backend
- dashboard principal sem N+1 para ultimo estado por promotor
- frontend preparado para `API base URL` configuravel
- base pronta para sincronizacao com app mobile via Capacitor
- perfil `prod` preparado para uso local com PostgreSQL
- cadastro local migrado do H2 para PostgreSQL
- Maven Wrapper ajustado para execucao consistente no Windows

## Qualidade

Checklist atual:

- contrato de API em Swagger/OpenAPI
- migracoes versionadas com Flyway
- perfis `dev`, `homolog` e `prod`
- observabilidade com `actuator`
- testes automatizados
- smoke test e checklist de homolog

## Autor

Projeto idealizado por **Pedro Cedro**  
InfoCedro Software
