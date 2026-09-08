# CONTEXTO_CODEX.md

Memoria compartilhada do projeto Controle Uber para uso entre computadores, sessoes e agentes (Claude Code, Codex ou outro).

## Regra permanente

- Antes de iniciar qualquer trabalho neste projeto, ler este arquivo.
- Se este arquivo nao existir em uma nova copia do projeto, recriar esta estrutura.
- Ao finalizar qualquer tarefa, atualizar este arquivo com decisoes, mudancas, pendencias, comandos relevantes e proximos passos.
- Manter os registros breves, objetivos e uteis para continuidade.
- Repositorio oficial local: `C:\Users\felipe.k\OneDrive\Documentos\14. Sistemas Kupka\App Uber`.
- Qualquer copia fora do OneDrive e apenas area temporaria.
- Antes de mexer em regra de negocio, fluxo, dados ou integracao, revisar as premissas deste arquivo.
- Se algum dia forem criados `REGRAS_NEGOCIO.md`, `DESIGN_SYSTEM.md` ou `ROADMAP.md`, consultar esses arquivos conforme o tipo de mudanca.
- Se a mudanca for visual, UX, layout, mobile, tema, cards ou botoes, revisar tambem a secao de UX/design deste arquivo.
- Se tocar pendencias conhecidas, consultar a secao de pendencias e perguntar se pendencias relacionadas devem entrar junto ou se o foco e apenas o pedido atual.
- Trabalhar de forma incremental, sem recriar estrutura nem trocar stack sem pedido explicito.
- Nao reverter alteracoes nao feitas por mim sem autorizacao clara.
- Criar backup no OneDrive antes de mudancas relevantes.
- Validar o que for possivel antes de finalizar, especialmente sintaxe JavaScript quando mexer em `app.js`.
- Revisar diff antes de finalizar.
- Atualizar documentacao quando a mudanca registrar regra, fluxo, decisao tecnica ou historico relevante.
- Fazer commit ao final de alteracao solicitada quando houver mudanca em arquivo.
- Fazer push ao final da acao quando houver mudanca de codigo, pois a validacao do usuario acontece em producao.
- **Fluxo obrigatorio para qualquer alteracao de codigo ou produto:** Analisar → listar o que muda → aguardar aprovacao → executar → commitar → push. Nunca pular a etapa de aprovacao.

## Projeto

- Nome: Controle Uber.
- Repositorio GitHub: `https://github.com/kupka1988/controle-uber.git`.
- Branch principal: `main`.
- Pasta oficial local: `C:\Users\felipe.k\OneDrive\Documentos\14. Sistemas Kupka\App Uber`.
- Pasta temporaria inicial da sessao Codex: `C:\Users\felipe.k\Documents\New project`.

## Fluxo combinado

- Antes de alterar arquivos do OneDrive, criar backup em `C:\Users\felipe.k\OneDrive\Documentos\14. Sistemas Kupka\App Uber\backups`.
- Aproveitar do Rota Financeira apenas as premissas de trabalho transferiveis: backup, alteracao cuidadosa, validacao, revisao de diff, documentacao, commit e push quando fizer sentido.
- Nao misturar conceitos de produto do Rota Financeira neste app.
- Para email de confirmacao, usar o mesmo modelo do Rota Financeira, trocando o assunto para iniciar com `Controle Uber`.

## Arquitetura atual

- App estatico em HTML, CSS e JavaScript puro.
- Nao migrar para React, Angular, Flutter ou outra stack sem pedido explicito.
- Arquivos principais:
  - `index.html`: estrutura da pagina e imports.
  - `styles.css`: estilos e responsividade mobile.
  - `app.js`: logica do app, dashboard, historico, import/export JSON, localStorage e Firebase.
  - `.firebaserc`: projeto Firebase padrao `controle-uber-9af6b`.
  - `.gitignore`: ignora `backups/` e `controle-uber.json`.
  - `firebase.json`: referencia local para regras do Firestore.
  - `firestore.rules`: regras seguras preparadas para Firestore.
- Foco principal de UX: mobile.
- Produto pessoal para controle operacional e financeiro de corridas/uso Uber conforme a logica ja existente no app.
- Nao importar conceitos de dividas, parcelas, rota de quitacao ou prioridades financeiras do Rota Financeira.
- Integracao atual: Firebase Firestore via scripts compat `firebase-app-compat.js` e `firebase-firestore-compat.js`.
- Documento usado no Firestore: `controleUber/estadoPrincipal`.

### Logica de fechamento de mes

- `fecharMesAtualManual()` salva um snapshot completo em `fechamentos[mesKey]` com `fechadoManual: true`.
- Apos o fechamento, `render()` detecta `snapMesFechado` e congela os KPIs de Inicio/Dashboard com os valores do snapshot — novos lancamentos no mesmo mes nao alteram os totais exibidos.
- `renderizarBannerMesFechado(snap)` injeta um banner verde no topo de `telaInicio` e `telaDashboard` enquanto o mes estiver fechado.
- O historico mensal (aba Historico) sempre usa o snapshot salvo para meses com `fechadoManual: true`.

## Premissas de UX/design

- Manter layout compacto, escaneavel e operacional.
- Tema claro e o padrao.
- Mobile, especialmente iPhone, deve ser cuidado continuamente.
- Nao criar botao sem implementacao.
- Nao usar `alert()` ou `confirm()` em novas funcionalidades; preferir modal/toast proprios. Os usos existentes no codigo sao legado e devem ser removidos gradualmente.
- Nao criar cards novos sem necessidade.
- Evitar excesso de texto explicativo dentro da interface.
- Preservar contexto do usuario em edicoes, importacoes, exclusoes e sincronizacoes.
- Quando o mes esta fechado, o app deve exibir um banner indicativo e congelar todos os KPIs; lancamentos posteriores ao fechamento nao devem afetar os totais do mes encerrado.

## Premissas de dados e seguranca

- Nao limpar, sobrescrever ou recriar dados do Firebase.
- Nao alterar Firebase alem do necessario para o pedido.
- Alteracoes em dados devem ser conservadoras e rastreaveis.
- Antes de excluir algo, garantir consistencia dos dados vinculados.

## Mudancas recentes

- Em 2026-07-27, criada a aba Simulacao, isolada dos dados reais: permite escolher mes/ano, definir uma rotina propria (incluindo feriados e excecoes), informar media diaria, custos, retirada e conforto para projetar o faturamento e ver a meta mais alta atingida. Os tres niveis tambem mostram o valor diario necessario a partir do realizado e dos dias planejados restantes. A rotina de trabalho agora apresenta domingo na primeira coluna e sabado na ultima. Nos cards de metas da Dashboard, a linha repetida de projecao foi substituida por "Faltam" e pelo valor diario necessario; "Retirada prevista" foi renomeada para "Sobra prevista", pois representa a projeção menos o maior entre custos planejados e despesas efetivas.
- Em 2026-07-27, reorganizada a Configuracao para deixar o cadastro de metas explicito: custos cadastrados formam Sobrevivencia, retirada desejada forma Estabilidade e o adicional separado forma Conforto, com os tres totais atualizados em tempo real.
- Em 2026-07-27, adicionados calendario de rotina com dias semanais, feriados nacionais e excecoes de trabalho/folga; a rotina so substitui o numero manual de dias apos ser configurada. Adicionada revisao de virada de mes no Dashboard, melhor dia da semana, mascara automatica de duas casas para litros e simplificado o modelo de metas: custos formam Sobrevivencia, retirada compoe Estabilidade e Conforto e um adicional explicito.
- Em 2026-06-16, decidido manter o projeto sem autenticacao; `firestore.rules` voltou a permitir leitura publica e escrita publica validada por formato/tamanho no documento `controleUber/estadoPrincipal`.
- Em 2026-05-29, melhorado o card de historico mensal: adicionados KPIs Media por dia, Receita/KM e Custo/KM; grid de KPIs expandido de 2 para 4 colunas (mobile: 2); adicionadas tags de conquista de meta (Sobrevivencia/Estabilidade/Conforto) com cor verde para atingida e cinza para nao atingida.
- Em 2026-05-29, implementado congelamento de dados apos fechamento manual do mes: `render()` passa a usar o snapshot salvo (`snapMesFechado`) para KPIs de Inicio e Dashboard; adicionada funcao `renderizarBannerMesFechado(snap)` que exibe banner verde informando o fechamento; `fecharMesAtualManual` passou a chamar `render()` em vez de apenas `renderizarHistoricoMensal`.
- Em 2026-05-24, executados ajustes de produto: removido saldo inicial da UI e dos calculos de resultado, padronizados gastos executados com sinal negativo/vermelho, custos planejados em vermelho sem sinal negativo, icone de despesa trocado para recibo, regua/conforto migrados para cores sem vermelho como conquista, frases do status da Dashboard humanizadas e adicionado botao `Fechar mes atual` no Historico para salvar fechamento manual do mes corrente.
- Backup criado antes dos ajustes gerais de produto: `20260524-084119`.
- Em 2026-05-23, removida repeticao do status do ritmo na Dashboard: a mensagem emocional fica destacada no topo e a regua mostra apenas projecao/proximo marco; adicionados query params em CSS/JS para forcar atualizacao em producao.
- Em 2026-05-23, corrigido o calculo da `Retirada prevista` para usar o maior valor entre custos base e custos ja lancados; corrigida tambem a faixa Conforto para nao herdar a retirada desejada quando ela estiver marcada para Estabilidade.
- Em 2026-05-23, `Sobra desejada` saiu do cadastro de metas e virou `Retirada desejada do mes` dentro de Configuracoes do Mes, com seletor `Conta para` padrao Estabilidade; o cadastro visual passou a ser `Custos do mes` e a Dashboard passou a mostrar `Retirada prevista`.
- Em 2026-05-23, a descricao de `Registrar despesa` passou a ser gerada pelas metas de custo cadastradas, com categorias padrao Seguro, Manutencao, Lavagem, Parcela e Outros.
- Em 2026-05-23, separada a natureza das metas entre `Custo mensal` e `Sobra desejada`; sobra projetada passou a usar apenas custos base.
- Em 2026-05-22, adicionada configuracao de tipo de veiculo (`Combustao` ou `Eletrico`) para trocar nomenclaturas de gasolina/litros por recarga/kWh sem duplicar logica.
- Em 2026-05-22, adicionada edicao de metas cadastradas e composicao das metas movida para Dashboard.
- Em 2026-05-22, metas passaram a ser cadastraveis ilimitadas com objetivo Sobrevivencia/Estabilidade/Conforto e migracao automatica de metas antigas.
- Em 2026-05-22, Dashboard refatorada com regua horizontal de ritmo substituindo velocimetro, cards de metas por objetivo e bloco de semanas do mes.
- Commit `cdf6c3a`: separacao do monolito em `index.html`, `styles.css` e `app.js`; CSP adicionada; escape de dados dinamicos; normalizacao de dados importados.
- Em 2026-05-18, instalados Git, Node.js, npm e Firebase CLI; Git inicializado na pasta do OneDrive e conectado ao remoto `origin/main`.
- Em 2026-05-18, `firestore.rules` atualizado com UID autorizado `vGKk21sl83bn4jEV3xltI4vD8ha2`.

## Pendencias importantes

- Publicar `firestore.rules` no Firebase com `firebase deploy --only firestore:rules --project controle-uber-9af6b` para restaurar o acesso sem autenticacao.
- Sem publicar as regras atuais, o banco pode continuar bloqueando o app em producao com `PERMISSION_DENIED`.
- Os usos de `alert()` e `confirm()` no codigo sao legado e devem ser migrados para componentes proprios (modal/toast) gradualmente.

## Comandos uteis

- Ver estado do Git: `git status --short --branch`.
- Ver ultimo commit: `git log -1 --oneline`.
- Validar whitespace do diff: `git diff --check`.
- Enviar alteracoes: `git add <arquivos>`, `git commit -m "<mensagem>"`, `git push origin main`.
- Publicar regras: `firebase deploy --only firestore:rules`.

## Proximos passos sugeridos

- Publicar `firestore.rules` no Firebase apos autenticar com `firebase login`.
- Migrar `alert()` e `confirm()` para modal/toast proprio.
- Fazer teste visual em mobile real apos alteracoes de layout.
