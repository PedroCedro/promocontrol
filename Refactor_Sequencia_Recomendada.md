# Refactor - Sequencia Recomendada

## Objetivo

Registrar a ordem recomendada de refactor tecnico para reduzir gambiarras e alto acoplamento no PromoControl, mantendo um ponto de retomada claro caso a sessao seja interrompida.

## Contexto

Analise tecnica identificou os principais riscos estruturais atuais:
- filtro de escopo por fornecedor sendo feito em memoria em alguns fluxos;
- dashboard com consulta N+1 para descobrir ultimo estado por promotor;
- perfis e autorizacao espalhados em strings literais;
- resolucao de escopo repetida nos controllers;
- frontend definitivo concentrado em um arquivo JS monolitico;
- regras dependentes de nome "magico".

Como o frontend foi confirmado como definitivo e o perfil `FORNECEDOR` nao deve crescer, a prioridade foi definida para atacar primeiro os pontos de backend com maior retorno tecnico imediato, antes da modularizacao do front.

## Sequencia recomendada

### 1. Levar o escopo de fornecedor para a camada de consulta

Problema:
- existem listagens com `findAll().stream().filter(...)`, o que mistura regra de acesso com pos-processamento em memoria;
- isso aumenta risco de vazamento de escopo e piora performance conforme a base cresce.

Resultado esperado:
- consultas ja retornam dados filtrados por `fornecedorId` quando houver escopo;
- services deixam de depender de filtro manual em memoria para proteger leitura.

Criterio de aceite:
- nenhuma listagem sensivel usa `findAll().stream().filter(...)` para escopo por fornecedor;
- testes de listagem continuam passando;
- comportamento funcional permanece igual para usuarios sem escopo.

Arquivos mais provaveis:
- `src/main/java/br/com/infocedro/promocontrol/application/service/MovimentoPromotorService.java`
- `src/main/java/br/com/infocedro/promocontrol/core/repository/MovimentoPromotorRepository.java`
- possivelmente `FornecedorService` e outros pontos de listagem relacionados

### 2. Remover N+1 do dashboard

Problema:
- o dashboard consulta ultimo movimento por promotor de forma individual;
- isso escala mal e gera custo oculto de banco nas telas mais usadas.

Resultado esperado:
- dashboard usa consulta agregada ou lote unico para obter estado atual;
- nenhuma parte do calculo principal depende de uma ida ao banco por promotor.

Criterio de aceite:
- logica de "em loja agora" deixa de usar consulta individual por item;
- testes de dashboard continuam verdes;
- resultado funcional do dashboard permanece consistente.

Arquivos mais provaveis:
- `src/main/java/br/com/infocedro/promocontrol/application/service/DashboardService.java`
- `src/main/java/br/com/infocedro/promocontrol/core/repository/MovimentoPromotorRepository.java`
- `src/test/java/br/com/infocedro/promocontrol/infra/controller/DashboardControllerTest.java`

### 3. Consolidar perfis e regras de autorizacao

Problema:
- `VIEWER`, `OPERATOR`, `GESTOR`, `ADMIN` e `FORNECEDOR` aparecem espalhados em strings;
- isso aumenta o risco de inconsistencias e dificulta manutencao.

Resultado esperado:
- perfis deixam de ser literais soltos no dominio;
- regras de permissao ficam centralizadas em estrutura simples e reutilizavel.

Criterio de aceite:
- perfis principais modelados de forma tipada ou centralizada;
- reducao objetiva de strings repetidas nas camadas de seguranca e usuario.

Arquivos mais provaveis:
- `src/main/java/br/com/infocedro/promocontrol/infra/security/AuthUserService.java`
- `src/main/java/br/com/infocedro/promocontrol/infra/security/UserAccessScopeService.java`
- `src/main/java/br/com/infocedro/promocontrol/infra/config/SecurityConfig.java`

### 4. Parar de repetir resolucao de escopo nos controllers

Problema:
- controllers repetem a mesma logica para resolver contexto autenticado e escopo de fornecedor.

Resultado esperado:
- controllers recebem contexto pronto ou acessam helper centralizado;
- menor duplicacao e menor chance de esquecer a regra em endpoint novo.

Criterio de aceite:
- reducao da repeticao de `resolveScope(...)` nos controllers operacionais;
- comportamento de autorizacao permanece igual.

### 5. Modularizar o frontend definitivo por dominio

Problema:
- o frontend atual esta concentrado em um arquivo grande com estado global, DOM e integracao HTTP misturados.

Resultado esperado:
- separacao em modulos por responsabilidade;
- bootstrap simples e reutilizavel para web e mobile.

Criterio de aceite:
- `app.js` deixa de concentrar tudo;
- responsabilidades separadas em modulos coerentes;
- funcionalidade atual preservada.

Arquivos mais provaveis:
- `src/main/resources/static/promocontrol/app.js`
- `src/main/resources/static/promocontrol/index.html`

### 6. Eliminar regras por nome magico

Problema:
- existem regras que dependem de nomes textuais como fornecedor tecnico/sistema.

Resultado esperado:
- regra passa a depender de identificador ou atributo explicito;
- sem dependencia de texto para comportamento interno.

Criterio de aceite:
- nenhuma regra estrutural depende de nome hardcoded para distinguir registro tecnico.

## Ordem de execucao aprovada

1. Escopo no repositorio
2. Dashboard sem N+1
3. Perfis e autorizacao centralizados
4. Resolucao de escopo centralizada
5. Frontend modularizado
6. Regras sem nome magico

## Cronograma sugerido por dia

Referencia temporal:
- hoje: 2026-03-12
- este cronograma foi ancorado nesta data para facilitar retomada futura

### Dia 1 - 2026-03-12

Foco:
- item 1: escopo no repositorio
- item 2: dashboard sem N+1

Entrega esperada:
- filtros de escopo saem do pos-processamento em memoria;
- dashboard deixa de fazer consulta individual por promotor para estado atual;
- testes direcionados de backend executados;
- documentacao impactada atualizada ao fechar a entrega.

Status planejado:
- ponto inicial de execucao do refactor

Status atual:
- iniciado em 2026-03-12 11:19:13 -03:00

### Dia 2 - 2026-03-13

Foco:
- item 3: perfis e autorizacao centralizados
- item 4: resolucao de escopo centralizada

Entrega esperada:
- menor espalhamento de strings de perfil;
- controllers com menos repeticao de regra de escopo;
- seguranca mais facil de manter e testar.

Status atual:
- iniciado em 2026-03-12 11:32:10 -03:00

### Dia 3 - 2026-03-14

Foco:
- item 6: eliminar regras por nome magico
- preparar a estrutura inicial do item 5

Entrega esperada:
- regras internas deixam de depender de nome textual hardcoded;
- definicao da base de modularizacao do frontend.

### Dia 4 - 2026-03-15

Foco:
- item 5: modularizacao inicial do frontend

Entrega esperada:
- extrair base comum do frontend:
  - autenticacao
  - sessao
  - requests HTTP
  - bootstrap principal

### Dia 5 - 2026-03-16

Foco:
- item 5: modularizacao dos modulos operacionais e administrativos
- ajustes finais

Entrega esperada:
- dashboard, operacao e cadastros separados por dominio;
- validacao final;
- documentacao e apontamentos de versao prontos para fechamento.

## Observacoes de processo

- Ao concluir entrega versionada: atualizar `README.md`, `CHANGELOG.md` e `ToDoList.md`.
- Seguir versionamento no padrao `v.x.x.x`.
- Antes de implementar, manter claro: contexto, problema, resultado esperado e criterio de aceite.
- DoD minimo: codigo compila, testes passam e documentacao impactada foi atualizada.

## Ponto de retomada

Se a sessao for interrompida, retomar por este arquivo e seguir a ordem acima, iniciando pelo item 1:
- mover filtros de escopo para a camada de consulta;
- depois atacar o dashboard para remover N+1.

Se a retomada ocorrer dias depois:
- verificar a data de referencia `2026-03-12`;
- localizar o ultimo dia concluido neste cronograma;
- continuar a partir do proximo item pendente.

## Regra adicional confirmada para o perfil FORNECEDOR

Definicao funcional:
- o usuario com perfil `FORNECEDOR` acessa apenas o painel referente aos seus proprios colaboradores;
- ele nao tem acesso a operacao de entrada/saida, cadastros administrativos ou visoes globais;
- o escopo de acesso dele e pelo `fornecedor` dono dos promotores, nao pela loja.

Exemplo:
- o fornecedor `X` possui promotores atuando nas lojas `A`, `B` e `D`;
- ao acessar o app, o fornecedor `X` pode visualizar somente os promotores vinculados ao fornecedor `X`, inclusive quando distribuidos em multiplas lojas;
- ele nao pode visualizar promotores de outros fornecedores, mesmo que estejam atuando nas mesmas lojas.

Implicacao tecnica:
- o filtro de seguranca e leitura do perfil `FORNECEDOR` deve sempre partir do `fornecedorId` vinculado ao usuario autenticado;
- consultas do painel mobile desse perfil nao devem depender de filtro manual apenas na interface;
- a regra de escopo por fornecedor precisa ser garantida no backend.
