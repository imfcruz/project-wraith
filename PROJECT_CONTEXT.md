# Project Wraith — Contexto do Projeto

> **Nome interno do projeto:** Project Wraith  
> **Produto real:** bot temporário de Halloween para Discord  
> **Estado atual:** planejamento e configuração inicial  
> **Idioma de trabalho:** português do Brasil

## 1. Finalidade deste arquivo

Este documento é a fonte principal de contexto para o Codex e para qualquer pessoa que trabalhe neste repositório. Antes de sugerir arquitetura, instalar dependências ou alterar código, leia este arquivo inteiro.

O projeto deve ser desenvolvido junto com o responsável, explicando decisões e comandos importantes. Não presuma que o ambiente já está configurado. Quando algo depender de informação ainda não fornecida — principalmente detalhes da API da Rill — pergunte ou crie uma abstração provisória, sem inventar endpoints, payloads ou credenciais.

Sempre que uma decisão importante for tomada, atualize este documento ou registre-a em `docs/decisions/`.

## 2. Contexto do responsável

O responsável pelo projeto:

- utiliza Linux (Zorin OS);
- trabalha no VS Code e no aplicativo Codex;
- já desenvolveu um bot de Discord em Node.js e JavaScript;
- quer usar este projeto para aprender TypeScript e melhorar sua organização técnica;
- prefere entender o que está sendo feito, e não apenas receber grandes blocos de código prontos;
- tem aproximadamente dez dias de acesso atual ao Codex e deseja aproveitar esse período para estruturar e avançar o máximo possível;
- usa o nome neutro **Project Wraith** para não expor publicamente o nome real do bot pela atividade do Discord/VS Code.

O Codex deve trabalhar de maneira incremental: explicar brevemente o objetivo de cada etapa, implementar uma parte verificável e confirmar o resultado antes de avançar para sistemas grandes.

## 3. Visão do produto

O bot será usado durante aproximadamente um mês como um evento completo de Halloween dentro de uma comunidade grande do Discord. Ele não deve ser apenas uma coleção de comandos ou minigames isolados.

O ciclo central pretendido é:

**participar de atividades → ganhar doces e itens → escolher entre benefício individual e contribuição coletiva → desbloquear recompensas e conteúdo → continuar participando**

O evento precisa manter relevância até o dia 31, sem depender de acontecimentos externos. Esse requisito vem de uma experiência anterior: um bot de Copa do Mundo focado em palpites perdeu boa parte do propósito quando o Brasil foi eliminado cedo. Neste projeto, a progressão e o clímax devem ser controlados pelo próprio evento.

## 4. Conceitos principais

### 4.1 Equipes

Existirão duas equipes temáticas, com nomes provisórios:

- **Caçadores**
- **Assombrações**

A entrada deve parecer aleatória para o participante, mas ser balanceada pelo sistema. Regra inicial sugerida:

1. atribuir o usuário à equipe com menos participantes;
2. em caso de empate, sortear entre as duas;
3. impedir que o usuário troque livremente de equipe.

Os três esquadrões permanentes já existentes no servidor não devem ser utilizados neste evento.

### 4.2 Doces

Doces serão a moeda principal do evento. Eles poderão ser obtidos em minigames, missões e eventos globais. O participante deverá decidir entre:

- gastar doces em recompensas pessoais;
- contribuir com o objetivo coletivo da própria equipe.

Além do saldo numérico, poderão existir doces especiais ou relíquias colecionáveis com raridades. Esses itens não devem ser confundidos com a moeda principal.

### 4.3 Caldeirão

Cada equipe deverá contribuir para um Caldeirão ao longo do mês. Este é o principal sistema coletivo e deve conduzir ao clímax do evento no dia 31.

A proposta inicial é dividir sua evolução em fases:

1. O Despertar;
2. Ingredientes Perdidos;
3. Ritual Sombrio;
4. Lua de Sangue;
5. Ritual Final de Halloween.

O total contribuído durante o mês deve importar, mas não necessariamente decidir sozinho o vencedor. Ele pode conceder vantagens no evento final, preservando a possibilidade de virada da equipe que estiver atrás. A regra final ainda precisa ser definida antes da implementação completa.

### 4.4 Progressão individual

O projeto não deve depender de um ranking tradicional no qual apenas os primeiros colocados recebem algo. Cada participante precisa perceber uma meta alcançável individualmente.

Sistemas considerados:

- saldo de doces;
- inventário;
- loja e resgates;
- missões diárias e semanais;
- conquistas, inclusive secretas;
- nível temático provisoriamente chamado de **Nível de Terror**;
- coleção temática provisoriamente chamada de **Grimório**.

Esses sistemas ainda devem ser priorizados por escopo. Não implementar todos simultaneamente.

### 4.5 Conteúdo gradual

Nem todo o conteúdo deve ser disponibilizado no primeiro dia. Estrutura narrativa provisória:

- Semana 1: equipes, doces, loja, primeiros minigames e Caldeirão;
- Semana 2: exploração, criaturas, Grimório e novos itens;
- Semana 3: eventos globais, missões especiais e novos minigames;
- Semana 4: Lua de Sangue, conteúdo raro e intensificação da disputa;
- dia 31: Ritual Final.

## 5. Minigames e eventos considerados

Estes itens são possibilidades de design, não uma lista obrigatória para a primeira versão:

- **Labirinto:** movimentação por botões, mapas gerados ou selecionados, armadilhas, baús e saída;
- **Trick or Treat:** escolha entre portas com risco e recompensa;
- **Ritual:** jogo de memória com sequências progressivas;
- **Caça-Fantasma:** aparições temporárias em canais e pequenas interações coletivas;
- **Cemitério:** exploração narrativa com escolhas e encontros reutilizáveis;
- **Pumpkin Smash:** escolha rápida entre abóboras com resultados variados;
- **Eventos globais:** Lua de Sangue, visita da Bruxa e desafios comunitários temporários.

O primeiro MVP deve conter no máximo um ou dois minigames simples depois que a fundação estiver pronta. Novos jogos devem usar interfaces comuns de sessão, recompensa, cooldown e auditoria.

## 6. Integração externa com a Rill

A Rill é o bot do dono do servidor. Existe a intenção de integrar o evento à API da Rill para permitir resgates instantâneos de recompensas, como:

- moedas;
- gemas;
- skins ou outros itens.

Ainda não estão documentados:

- URL base;
- autenticação;
- endpoints;
- payloads;
- limites de requisição;
- códigos de erro;
- existência de idempotência;
- ambiente de testes;
- regras exatas de resgate.

Até que a documentação real seja fornecida, criar uma interface `RewardProvider` e uma implementação simulada/local. A integração real deve ficar isolada em um módulo de infraestrutura. Nunca registrar tokens, segredos ou payloads sensíveis em logs.

Todo resgate deve ser idempotente e auditável. Uma falha externa não pode cobrar permanentemente o usuário sem entregar a recompensa. O fluxo definitivo deverá considerar reserva do saldo, tentativa externa, confirmação ou compensação segura.

## 7. Stack técnica pretendida

- **Runtime:** Node.js em versão LTS compatível;
- **Linguagem:** TypeScript com modo estrito;
- **Biblioteca Discord:** versão estável recente do `discord.js` com suporte aos Components V2;
- **Interface principal:** Components V2 e Containers;
- **Banco recomendado:** PostgreSQL;
- **ORM/query builder:** decidir entre Prisma e Drizzle após comparar a versão atual, suporte a transações e ergonomia;
- **Gerenciador de pacotes:** definir durante o bootstrap; não misturar lockfiles;
- **Testes:** framework leve compatível com TypeScript, a definir;
- **Qualidade:** lint, formatação, typecheck e scripts claros no `package.json`.

Antes de instalar pacotes, conferir as versões atuais e a documentação oficial. Não confiar em APIs antigas do Discord ou exemplos desatualizados.

## 8. Decisão inicial sobre banco de dados

SQLite consegue manter consistência em trocas e movimentações de itens quando são usadas transações corretamente. O problema principal não é a existência de trocas, mas concorrência de escrita, operação em mais de uma instância, crescimento, observabilidade e implantação.

Para este projeto, a recomendação inicial é **PostgreSQL**, porque haverá economia, inventário, transferências ou trocas, contribuições coletivas, resgates externos e ações potencialmente simultâneas. PostgreSQL oferece uma margem melhor para transações concorrentes e evita uma migração arriscada perto do evento.

SQLite continua aceitável somente se todas estas condições forem verdadeiras:

- haverá uma única instância do bot;
- o volume de escrita será baixo ou moderado;
- a hospedagem terá disco persistente e backup confiável;
- todas as operações econômicas críticas usarão transações;
- existe aceitação explícita das limitações de concorrência.

A escolha definitiva deve considerar também onde o bot será hospedado. Não iniciar o modelo de dados definitivo sem confirmar hospedagem e disponibilidade do PostgreSQL.

## 9. Regras de integridade e segurança

Estas regras são obrigatórias para qualquer operação de economia:

- valores monetários e quantidades devem ser inteiros; não usar ponto flutuante;
- saldos não podem ficar negativos;
- débito, crédito e criação de histórico devem ocorrer na mesma transação;
- trocas precisam bloquear ou validar novamente os recursos envolvidos no momento da confirmação;
- interações duplicadas do Discord não podem conceder recompensa duas vezes;
- resgates externos precisam de chave de idempotência;
- ações administrativas e econômicas devem gerar auditoria;
- cooldowns devem ser persistentes quando forem relevantes contra abuso;
- permissões devem ser verificadas no servidor, não apenas escondidas na interface;
- segredos ficam em variáveis de ambiente e nunca entram no Git;
- comandos de desenvolvimento e produção precisam ser claramente separados.

## 10. Arquitetura desejada

Usar uma arquitetura modular, sem exagerar em abstrações antes da necessidade. Separar regras do domínio das APIs do Discord, do banco de dados e da Rill.

Módulos iniciais previstos:

- `discord`: cliente, handlers, eventos e componentes;
- `players`: inscrição e perfil do participante;
- `teams`: atribuição balanceada e dados coletivos;
- `economy`: saldo, lançamentos e regras de recompensa;
- `inventory`: itens e quantidades;
- `cauldron`: contribuições e fases;
- `games`: contrato de sessões e minigames;
- `missions`: progresso e recompensas;
- `rewards`: catálogo, resgates e integração Rill;
- `admin`: configuração operacional e auditoria;
- `shared`: erros, validações, tipos e utilitários realmente compartilhados.

Não criar arquivos gigantes de comandos. Interações do Discord devem chamar serviços/casos de uso, e não concentrar regra de negócio.

## 11. Entidades iniciais a considerar

O modelo será refinado antes das migrations, mas provavelmente incluirá:

- `GuildConfig`;
- `Player`;
- `Team`;
- `Wallet`;
- `LedgerEntry`;
- `InventoryItem`;
- `ItemDefinition`;
- `CauldronContribution`;
- `MissionDefinition` e `MissionProgress`;
- `GameSession`;
- `RewardDefinition`;
- `Redemption`;
- `Achievement` e `PlayerAchievement`;
- `AuditLog`.

Preferir um livro-razão (`LedgerEntry`) para registrar mudanças de saldo em vez de alterar apenas um número sem histórico. O saldo pode ser armazenado ou calculado conforme a estratégia escolhida, mas toda alteração precisa ter origem identificável.

## 12. Experiência no Discord

O bot deverá priorizar interfaces com Components V2 e Containers. Requisitos:

- mensagens legíveis e visualmente temáticas;
- botões com estados de carregamento, expiração e prevenção de clique duplicado;
- respostas efêmeras quando houver dados pessoais, erros ou confirmações;
- painéis persistentes capazes de sobreviver a reinicializações;
- tratamento claro de sessão expirada;
- acessibilidade e clareza acima de excesso decorativo;
- evitar depender apenas de slash commands para a experiência principal.

Antes de implementar, confirmar na documentação oficial atual como Components V2 afeta conteúdo, embeds, flags e edição de mensagens.

## 13. Prioridade de implementação

### Fase 0 — Descoberta

1. confirmar versão do Node e ferramentas presentes no Linux;
2. confirmar hospedagem prevista;
3. obter documentação ou contato técnico da API da Rill;
4. definir escopo realista do MVP;
5. confirmar datas de abertura e encerramento do evento.

### Fase 1 — Fundação

1. iniciar Git e Node/TypeScript;
2. configurar `discord.js`, variáveis de ambiente e validação de configuração;
3. configurar lint, formatação, typecheck e testes;
4. criar estrutura modular e logging;
5. conectar o bot em ambiente de desenvolvimento;
6. criar um painel mínimo com Components V2;
7. configurar PostgreSQL local e migrations.

### Fase 2 — Núcleo jogável

1. inscrição de participante;
2. distribuição balanceada de equipes;
3. carteira e livro-razão de doces;
4. painel de perfil;
5. contribuição ao Caldeirão com transação e auditoria;
6. um minigame simples com recompensa e cooldown.

### Fase 3 — Recompensas e expansão

1. inventário e catálogo;
2. provider simulado de recompensas;
3. integração real com a Rill após documentação;
4. segundo minigame;
5. missões e progressão selecionadas para o MVP;
6. ferramentas administrativas.

### Fase 4 — Operação

1. testes de concorrência nas operações econômicas;
2. testes de reinicialização e painéis persistentes;
3. backup e restauração;
4. métricas, alertas e logs seguros;
5. ensaio do encerramento e Ritual Final;
6. plano para indisponibilidade da Rill.

## 14. Forma de trabalho esperada do Codex

Ao receber uma tarefa neste repositório:

1. leia este arquivo e inspecione o estado atual do projeto;
2. verifique instruções locais adicionais, scripts e mudanças não commitadas;
3. explique em poucas linhas o que será feito e por quê;
4. quando houver escolha relevante, apresente a recomendação e o impacto;
5. implemente em etapas pequenas e coerentes;
6. execute typecheck, testes e lint relacionados ao que mudou;
7. não sobrescreva alterações existentes sem necessidade;
8. atualize documentação quando alterar arquitetura, banco ou regra de negócio;
9. ao terminar, resuma arquivos alterados, validações feitas e próximo passo recomendado.

Não instalar dezenas de bibliotecas antecipadamente. Não gerar todos os módulos vazios apenas para parecer que a arquitetura está pronta. Criar cada abstração quando houver um caso de uso concreto para sustentá-la.

## 15. Primeira solicitação sugerida ao Codex

Após colocar este arquivo na raiz do projeto, usar uma mensagem semelhante a esta:

> Leia `PROJECT_CONTEXT.md` por completo e considere-o a fonte principal do projeto. Ainda estamos começando do zero. Primeiro, inspecione meu ambiente Linux e a pasta atual sem fazer alterações destrutivas. Depois, proponha uma sequência curta para configurar Node.js, TypeScript, Git e o projeto com discord.js e Components V2. Explique cada etapa de forma didática. Antes de escolher versões ou usar APIs do Discord, confira a documentação oficial atual. Não implemente os sistemas do jogo ainda: quero primeiro deixar a fundação funcionando, com o bot online, configuração segura por `.env`, scripts de desenvolvimento/typecheck e um painel mínimo de teste.

## 16. Decisões pendentes

- nome público definitivo do bot e do evento;
- datas exatas do evento;
- provedor de hospedagem;
- disponibilidade e endereço do PostgreSQL;
- gerenciador de pacotes;
- Prisma ou Drizzle;
- regras finais do Caldeirão e do Ritual Final;
- lista e preços das recompensas;
- documentação real da API da Rill;
- quais sistemas entram no MVP e quais ficam como expansão;
- canais, cargos e permissões do servidor de testes e produção.

Este documento descreve a direção atual, não um contrato imutável. Mudanças são permitidas, mas devem ser explícitas e registradas.
