const firebaseConfig = {
  apiKey: "AIzaSyAUzriWAPOLNVwaGkT02FlIuxgjzIv3COw",
  authDomain: "controle-uber-9af6b.firebaseapp.com",
  projectId: "controle-uber-9af6b",
  storageBucket: "controle-uber-9af6b.firebasestorage.app",
  messagingSenderId: "847499399736",
  appId: "1:847499399736:web:f75460529adf76e4f74ccd"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const estadoRef = db.collection("controleUber").doc("estadoPrincipal");

let tipo = "ganho";
let dados = [];
let fechamentos = {};
let config = {
  saldoInicial: 0,
  metaGasolina: 0,
  metaSeguro: 0,
  metaCustosGerais: 0,
  metaParcela: 0,
  diasPlanejados: 0,
  metaConsistente: 0,
  tipoVeiculo: "combustao",
  retiradaDesejada: 0,
  retiradaObjetivo: "estabilidade",
  confortoDesejado: 0,
  diasSemana: [],
  trabalhoEmFeriados: false,
  diasFolgaExtra: [],
  diasTrabalhoExtra: [],
  modeloMetasVersao: 1,
  metas: []
};

const STORAGE_KEY = "controleUberFelipe";
const CONFIG_KEY = "controleUberFelipeConfig";
const HISTORICO_KEY = "controleUberFelipeFechamentos";
const CATEGORIAS_DESPESA_PADRAO = ["Seguro", "Manutenção", "Lavagem", "Parcela", "Outros"];
let firebaseCarregado = false;
let salvandoFirebase = false;
let bloqueiaRestauracaoLocal = false;
let metaEmEdicaoId = null;
let mesCalendarioRotina = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let simulacao = null;

document.getElementById("importarArquivo").addEventListener("change", importarJSON);
document.getElementById("data").addEventListener("change", atualizarDataPorExtenso);
document.getElementById("abaInicio").addEventListener("click", () => trocarAba("inicio"));
document.getElementById("abaDashboard").addEventListener("click", () => trocarAba("dashboard"));
document.getElementById("abaSimulacao").addEventListener("click", () => trocarAba("simulacao"));
document.getElementById("abaHistorico").addEventListener("click", () => trocarAba("historico"));
document.getElementById("abaFechamentos").addEventListener("click", () => trocarAba("fechamentos"));
document.getElementById("abaConfig").addEventListener("click", () => trocarAba("config"));
document.getElementById("btnGanho").addEventListener("click", () => selecionar("ganho"));
document.getElementById("btnGasolina").addEventListener("click", () => selecionar("gasolina"));
document.getElementById("btnDespesas").addEventListener("click", () => selecionar("despesas"));
document.getElementById("btnKM").addEventListener("click", () => selecionar("km"));
document.getElementById("btnAdicionar").addEventListener("click", adicionar);
document.querySelectorAll('[data-action="salvar-config"]').forEach(botao => {
  botao.addEventListener("click", salvarConfiguracoes);
});
document.querySelectorAll('[data-action="cadastrar-meta"]').forEach(botao => {
  botao.addEventListener("click", cadastrarMeta);
});
if (document.getElementById("btnCancelarMeta")) {
  btnCancelarMeta.addEventListener("click", cancelarEdicaoMeta);
}
if (document.getElementById("btnFecharMes")) {
  btnFecharMes.addEventListener("click", fecharMesAtualManual);
}
if (document.getElementById("btnRevisarMes")) {
  btnRevisarMes.addEventListener("click", () => {
    trocarAba("config");
    document.getElementById("telaConfig")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
if (document.getElementById("tipoVeiculo")) {
  tipoVeiculo.addEventListener("change", () => {
    config.tipoVeiculo = tipoVeiculoSeguro(tipoVeiculo.value);
    render();
    selecionar(tipo);
  });
}
if (document.getElementById("litros")) {
  document.getElementById("litros").addEventListener("input", event => formatarCampoDecimalDireto(event.target));
}
document.querySelectorAll("[data-weekday]").forEach(botao => {
  botao.addEventListener("click", () => alternarDiaSemana(Number(botao.dataset.weekday)));
});
if (document.getElementById("trabalhoEmFeriados")) {
  document.getElementById("trabalhoEmFeriados").addEventListener("change", event => {
    config.trabalhoEmFeriados = event.target.checked;
    renderizarRotinaMensal();
  });
}
if (document.getElementById("btnCalendarioAnterior")) {
  document.getElementById("btnCalendarioAnterior").addEventListener("click", () => navegarCalendarioRotina(-1));
  document.getElementById("btnCalendarioProximo").addEventListener("click", () => navegarCalendarioRotina(1));
  document.getElementById("calendarioRotina").addEventListener("click", event => {
    const botao = event.target.closest("[data-calendar-date]");
    if (botao) alternarExcecaoRotina(botao.dataset.calendarDate);
  });
}
document.getElementById("btnExportar").addEventListener("click", exportarJSON);
document.getElementById("btnImportar").addEventListener("click", () => document.getElementById("importarArquivo").click());
document.getElementById("btnLimpar").addEventListener("click", limparDados);
["valor", "metaValor", "retiradaDesejada", "confortoDesejado"].forEach(id => {
  const campo = document.getElementById(id);
  if (campo) {
    campo.addEventListener("input", event => {
      formatarCampoMoedaDigitando(event.target);
      if (id === "retiradaDesejada" || id === "confortoDesejado") atualizarResumoMetasConfig();
    });
    campo.addEventListener("blur", event => {
      formatarCampoMoeda(event.target);
      if (id === "retiradaDesejada" || id === "confortoDesejado") atualizarResumoMetasConfig();
    });
  }
});

function trocarAba(aba) {
  telaInicio.classList.add("hidden");
  telaDashboard.classList.add("hidden");
  telaSimulacao.classList.add("hidden");
  telaHistorico.classList.add("hidden");
  telaFechamentos.classList.add("hidden");
  telaConfig.classList.add("hidden");

  abaInicio.classList.remove("ativo");
  abaDashboard.classList.remove("ativo");
  abaSimulacao.classList.remove("ativo");
  abaHistorico.classList.remove("ativo");
  abaFechamentos.classList.remove("ativo");
  abaConfig.classList.remove("ativo");

  if (aba === "inicio") {
    telaInicio.classList.remove("hidden");
    abaInicio.classList.add("ativo");
  }


  if (aba === "dashboard") {
    telaDashboard.classList.remove("hidden");
    abaDashboard.classList.add("ativo");
  }

  if (aba === "simulacao") {
    telaSimulacao.classList.remove("hidden");
    abaSimulacao.classList.add("ativo");
    renderizarSimulacao();
  }

  if (aba === "historico") {
    telaHistorico.classList.remove("hidden");
    abaHistorico.classList.add("ativo");
  }

  if (aba === "fechamentos") {
    telaFechamentos.classList.remove("hidden");
    abaFechamentos.classList.add("ativo");
  }

  if (aba === "config") {
    telaConfig.classList.remove("hidden");
    abaConfig.classList.add("ativo");
  }
}

function selecionar(novoTipo) {
  tipo = novoTipo;
  const rotulos = rotulosVeiculo();

  ["btnGanho", "btnGasolina", "btnDespesas", "btnKM"].forEach(id => {
    document.getElementById(id).classList.remove("ativo");
  });

  campoDescricao.classList.add("hidden");
  campoValor.classList.remove("hidden");
  campoLitros.classList.add("hidden");

  if (tipo === "ganho") {
    btnGanho.classList.add("ativo");
    labelValor.innerText = "Valor ganho";
    valor.placeholder = "Ex: R$ 150,00";
  }

  if (tipo === "gasolina") {
    btnGasolina.classList.add("ativo");
    labelValor.innerText = rotulos.valorEnergia;
    valor.placeholder = "Ex: R$ 250,00";
    campoLitros.classList.remove("hidden");
  }

  if (tipo === "despesas") {
    btnDespesas.classList.add("ativo");
    labelValor.innerText = "Valor da despesa";
    valor.placeholder = "Ex: R$ 80,00";
    atualizarOpcoesDescricaoDespesa();
    campoDescricao.classList.remove("hidden");
  }

  if (tipo === "km") {
    btnKM.classList.add("ativo");
    campoValor.classList.add("hidden");
  }
}

async function adicionar() {
  const rotulos = rotulosVeiculo();
  const data = document.getElementById("data").value;
  const valorCampo = document.getElementById("valor").value;
  const litrosCampo = document.getElementById("litros").value;
  const kmCampo = document.getElementById("km").value;

  if (!data) return alert("Informe a data");

  let descricao = "";
  let valorLancamento = parseMoeda(valorCampo);
  let litros = parseDecimalBR(litrosCampo) || null;
  let km = parseDecimalBR(kmCampo) || null;

  if (tipo === "ganho") {
    if (!valorCampo) return alert("Informe o valor ganho");
    descricao = "Ganhos Uber";
    valorLancamento = Math.abs(valorLancamento);
  }

  if (tipo === "gasolina") {
    if (!valorCampo) return alert(rotulos.alertaValorEnergia);
    if (!litrosCampo) return alert(rotulos.alertaQuantidadeEnergia);
    descricao = rotulos.descricaoEnergia;
    valorLancamento = Math.abs(valorLancamento) * -1;
  }

  if (tipo === "despesas") {
    if (!valorCampo) return alert("Informe o valor da despesa");
    descricao = document.getElementById("descricao").value;
    valorLancamento = Math.abs(valorLancamento) * -1;
  }

  if (tipo === "km") {
    if (!kmCampo) return alert("Informe o KM atual");
    descricao = "Atualização de KM";
    valorLancamento = 0;
    litros = null;
  }

  dados.push({
    id: gerarId(),
    data,
    tipo,
    descricao,
    valor: valorLancamento,
    litros,
    km
  });

  limparFormulario();
  document.body.classList.remove("lancamento-aberto");
  executarManutencaoMensal(false);
  render();
  await salvarEstado();
}

async function salvarConfiguracoes() {
  config.saldoInicial = 0;
  config.diasPlanejados = rotinaConfigurada()
    ? calcularDiasPlanejadosDoMes(new Date().getFullYear(), new Date().getMonth() + 1, config)
    : (parseInt(diasPlanejados.value) || 0);
  config.tipoVeiculo = tipoVeiculoSeguro(document.getElementById("tipoVeiculo")?.value);
  config.retiradaDesejada = parseMoeda(document.getElementById("retiradaDesejada")?.value);
  config.retiradaObjetivo = "estabilidade";
  config.confortoDesejado = parseMoeda(document.getElementById("confortoDesejado")?.value);
  config.modeloMetasVersao = 2;
  config.revisaoMesPendente = "";
  migrarMetasConfiguradas();

  preencherCamposConfig();
  render();
  await salvarEstado();
}

async function cadastrarMeta() {
  const nome = limitarTexto(document.getElementById("metaNome").value, 60);
  const valor = parseMoeda(document.getElementById("metaValor").value);
  const objetivo = "sobrevivencia";
  const tipoMeta = "custo";

  if (!nome) return alert("Informe o nome do custo.");
  if (!valor) return alert("Informe o valor do custo.");

  migrarMetasConfiguradas();
  if (metaEmEdicaoId) {
    config.metas = config.metas.map(meta => String(meta.id) === String(metaEmEdicaoId)
      ? { ...meta, nome, valor, objetivo, tipoMeta }
      : meta
    );
  } else {
    config.metas.push({
      id: gerarId(),
      nome,
      valor,
      objetivo,
      tipoMeta
    });
  }

  resetarFormularioMeta();

  preencherCamposConfig();
  render();
  await salvarEstado();
}

function resetarFormularioMeta() {
  metaEmEdicaoId = null;
  document.getElementById("metaNome").value = "";
  document.getElementById("metaValor").value = "";
  if (document.getElementById("btnSalvarMeta")) btnSalvarMeta.innerText = "Cadastrar custo";
  if (document.getElementById("btnCancelarMeta")) btnCancelarMeta.classList.add("hidden");
}

function iniciarEdicaoMeta(id) {
  migrarMetasConfiguradas();
  const meta = config.metas.find(item => String(item.id) === String(id));
  if (!meta) return;

  metaEmEdicaoId = String(meta.id);
  document.getElementById("metaNome").value = meta.nome;
  document.getElementById("metaValor").value = moeda(meta.valor);
  if (document.getElementById("btnSalvarMeta")) btnSalvarMeta.innerText = "Salvar alterações";
  if (document.getElementById("btnCancelarMeta")) btnCancelarMeta.classList.remove("hidden");
}

function cancelarEdicaoMeta() {
  resetarFormularioMeta();
}

function limparFormulario() {
  valor.value = "";
  litros.value = "";
  km.value = "";
}

function textoSeguro(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function numeroPercentualSeguro(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  return Math.min(Math.max(numero, 0), 100);
}

function objetivoMetaSeguro(valor) {
  return ["sobrevivencia", "estabilidade", "conforto"].includes(valor) ? valor : "sobrevivencia";
}

function tipoMetaSeguro(valor) {
  return valor === "sobra" ? "sobra" : "custo";
}

function tipoMetaPorNome(nome) {
  const nomeNormalizado = String(nome || "").toLowerCase();
  return nomeNormalizado.includes("sobra") || nomeNormalizado.includes("reserva") ? "sobra" : "custo";
}

function chaveMeta(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rotuloTipoMeta(valor) {
  return tipoMetaSeguro(valor) === "sobra" ? "Sobra desejada" : "Custo mensal";
}

function ehMetaSobra(meta) {
  return tipoMetaSeguro(meta?.tipoMeta) === "sobra";
}

function rotuloObjetivoMeta(valor) {
  const objetivo = objetivoMetaSeguro(valor);
  if (objetivo === "estabilidade") return "Estabilidade";
  if (objetivo === "conforto") return "Conforto";
  return "Sobrevivência";
}

function tipoVeiculoSeguro(valor) {
  return valor === "eletrico" ? "eletrico" : "combustao";
}

function rotulosVeiculo(configBase = config) {
  const eletrico = tipoVeiculoSeguro(configBase.tipoVeiculo) === "eletrico";
  return eletrico
    ? {
        acaoEnergia: "Recarga",
        valorEnergia: "Valor da recarga",
        quantidadeEnergia: "kWh carregados",
        quantidadeCurta: "kWh",
        placeholderQuantidade: "Ex: 42,5",
        grupoEnergia: "Energia",
        gastoEnergia: "Gasto com energia",
        descricaoEnergia: "Energia",
        metaEnergia: "Ex: Energia",
        alertaValorEnergia: "Informe o valor da recarga",
        alertaQuantidadeEnergia: "Informe os kWh carregados",
        resumoQuantidadeHistorico: "kWh"
      }
    : {
        acaoEnergia: "Gasolina",
        valorEnergia: "Valor da gasolina",
        quantidadeEnergia: "Litros abastecidos",
        quantidadeCurta: "Litros",
        placeholderQuantidade: "Ex: 42,5",
        grupoEnergia: "Combustível",
        gastoEnergia: "Gasto com gasolina",
        descricaoEnergia: "Gasolina",
        metaEnergia: "Ex: Gasolina",
        alertaValorEnergia: "Informe o valor da gasolina",
        alertaQuantidadeEnergia: "Informe os litros abastecidos",
        resumoQuantidadeHistorico: "litros"
      };
}

function ehLancamentoEnergia(item) {
  return item?.tipo === "gasolina" || item?.descricao === "Gasolina" || item?.descricao === "Energia";
}

function descricaoVisivelLancamento(item) {
  return ehLancamentoEnergia(item) ? rotulosVeiculo().descricaoEnergia : item.descricao;
}

function atualizarRotulosVeiculo() {
  const rotulos = rotulosVeiculo();
  const botaoEnergia = document.querySelector("#btnGasolina .botao-main");
  if (botaoEnergia) botaoEnergia.innerText = rotulos.acaoEnergia;

  const labelQuantidade = document.querySelector("#campoLitros label");
  if (labelQuantidade) labelQuantidade.innerText = rotulos.quantidadeEnergia;
  const campoQuantidade = document.getElementById("litros");
  if (campoQuantidade) campoQuantidade.placeholder = rotulos.placeholderQuantidade;

  const grupoEnergia = document.querySelector(".operacao-combustivel-grid")?.closest(".operacao-grupo")?.querySelector(".operacao-grupo-titulo");
  if (grupoEnergia) grupoEnergia.innerText = rotulos.grupoEnergia;
  const totalEnergiaLabel = document.getElementById("litrosTotal")?.closest(".resumo-item")?.querySelector("span");
  if (totalEnergiaLabel) totalEnergiaLabel.innerText = rotulos.quantidadeEnergia;
  const gastoEnergiaLabel = document.getElementById("gastoGasolina")?.closest(".resumo-item")?.querySelector("span");
  if (gastoEnergiaLabel) gastoEnergiaLabel.innerText = rotulos.gastoEnergia;

  const metaNome = document.getElementById("metaNome");
  if (metaNome) metaNome.placeholder = rotulos.metaEnergia;
  const quantidadeHistorico = document.querySelector(".historico-table th:nth-child(4)");
  if (quantidadeHistorico) {
    quantidadeHistorico.innerText = rotulos.quantidadeCurta;
    quantidadeHistorico.classList.toggle("preservar-capitalizacao", rotulos.quantidadeCurta === "kWh");
  }
  atualizarOpcoesDescricaoDespesa();
}

function metasPadraoConfig() {
  return [
    { nome: rotulosVeiculo().descricaoEnergia, valor: 0, objetivo: "sobrevivencia", tipoMeta: "custo" },
    { nome: "Seguro", valor: 0, objetivo: "sobrevivencia", tipoMeta: "custo" },
    { nome: "Manutenção", valor: 0, objetivo: "sobrevivencia", tipoMeta: "custo" },
    { nome: "Lavagem", valor: 0, objetivo: "sobrevivencia", tipoMeta: "custo" },
    { nome: "Parcela", valor: 0, objetivo: "conforto", tipoMeta: "custo" }
  ];
}

function aplicarMetasPadrao() {
  const existentes = new Set(config.metas.map(meta => chaveMeta(meta.nome)));
  const existeMetaEnergia = ["gasolina", "energia", "recarga"].some(nome => existentes.has(nome));
  metasPadraoConfig().forEach(metaPadrao => {
    if (["gasolina", "energia", "recarga"].includes(chaveMeta(metaPadrao.nome)) && existeMetaEnergia) return;
    if (!existentes.has(chaveMeta(metaPadrao.nome))) {
      config.metas.push({ id: gerarId(), ...metaPadrao });
      existentes.add(chaveMeta(metaPadrao.nome));
    }
  });
}

function opcoesDescricaoDespesa() {
  const opcoes = [];
  const vistas = new Set();
  const adicionarOpcao = nome => {
    const nomeSeguro = limitarTexto(nome, 60);
    const chave = chaveMeta(nomeSeguro);
    if (!nomeSeguro || vistas.has(chave)) return;
    opcoes.push(nomeSeguro);
    vistas.add(chave);
  };

  (Array.isArray(config.metas) ? config.metas : [])
    .filter(meta => !ehMetaSobra(meta))
    .forEach(meta => adicionarOpcao(meta.nome));

  [rotulosVeiculo().descricaoEnergia, ...CATEGORIAS_DESPESA_PADRAO].forEach(adicionarOpcao);
  return opcoes;
}

function atualizarOpcoesDescricaoDespesa() {
  const select = document.getElementById("descricao");
  if (!select) return;
  const valorAtual = select.value;
  const opcoes = opcoesDescricaoDespesa();
  select.innerHTML = opcoes
    .map(opcao => `<option value="${textoSeguro(opcao)}">${textoSeguro(opcao)}</option>`)
    .join("");
  if (opcoes.includes(valorAtual)) select.value = valorAtual;
}

function normalizarMetasConfig() {
  const modeloSimplificado = Number(config.modeloMetasVersao) >= 2;
  config.metas = (Array.isArray(config.metas) ? config.metas : [])
    .map(meta => ({
      id: meta.id ? String(meta.id) : gerarId(),
      nome: limitarTexto(meta.nome || meta.name, 60),
      valor: Number(meta.valor ?? meta.value) || 0,
      objetivo: modeloSimplificado ? "sobrevivencia" : objetivoMetaSeguro(meta.objetivo || meta.categoria || meta.tipo),
      tipoMeta: tipoMetaSeguro(meta.tipoMeta || meta.comportamento || tipoMetaPorNome(meta.nome || meta.name))
    }))
    .filter(meta => meta.nome && meta.valor >= 0);

  const metaSobra = config.metas.find(ehMetaSobra);
  if (metaSobra) {
    if (!config.retiradaDesejada) config.retiradaDesejada = Number(metaSobra.valor) || 0;
    config.retiradaObjetivo = modeloSimplificado ? "estabilidade" : objetivoMetaSeguro(config.retiradaObjetivo || metaSobra.objetivo || "estabilidade");
    config.metas = config.metas.filter(meta => !ehMetaSobra(meta));
  }

  if (modeloSimplificado) {
    config.retiradaObjetivo = "estabilidade";
    config.metas = config.metas.map(meta => ({ ...meta, objetivo: "sobrevivencia", tipoMeta: "custo" }));
  }
}

function migrarMetasConfiguradas() {
  normalizarMetasConfig();
  if (config.metas.length) {
    if (!config.retiradaDesejada && Number(config.metaConsistente) > 0) {
      config.retiradaDesejada = Number(config.metaConsistente) || 0;
      config.retiradaObjetivo = "estabilidade";
    }
    aplicarMetasPadrao();
    limparMetasLegadas();
    return;
  }

  const antigas = [
    { nome: rotulosVeiculo().descricaoEnergia, valor: Number(config.metaGasolina) || 0, objetivo: "sobrevivencia" },
    { nome: "Seguro", valor: Number(config.metaSeguro) || 0, objetivo: "sobrevivencia" },
    { nome: "Custos gerais", valor: Number(config.metaCustosGerais) || 0, objetivo: "sobrevivencia" },
    { nome: "Parcela", valor: Number(config.metaParcela) || 0, objetivo: "conforto" }
  ].filter(meta => meta.valor > 0);

  if (!config.retiradaDesejada && Number(config.metaConsistente) > 0) {
    config.retiradaDesejada = Number(config.metaConsistente) || 0;
    config.retiradaObjetivo = "estabilidade";
  }

  config.metas = antigas.map(meta => ({ id: gerarId(), tipoMeta: "custo", ...meta }));
  aplicarMetasPadrao();
  limparMetasLegadas();
}

function limparMetasLegadas() {
  config.metaGasolina = 0;
  config.metaSeguro = 0;
  config.metaCustosGerais = 0;
  config.metaParcela = 0;
  config.metaConsistente = 0;
}

function totaisMetasConfig(configBase = config) {
  const metas = Array.isArray(configBase.metas) ? configBase.metas : [];
  if (!metas.length) {
    const sobrevivenciaLegada = (Number(configBase.metaGasolina) || 0) + (Number(configBase.metaSeguro) || 0) + (Number(configBase.metaCustosGerais) || 0);
    const estabilidadeLegada = sobrevivenciaLegada + (Number(configBase.metaConsistente) || 0);
    const confortoLegado = estabilidadeLegada + (Number(configBase.metaParcela) || 0);
    return { sobrevivencia: sobrevivenciaLegada, estabilidade: estabilidadeLegada, conforto: confortoLegado };
  }

  if (Number(configBase.modeloMetasVersao) >= 2) {
    const sobrevivencia = metas.reduce((soma, meta) => soma + (Number(meta.valor) || 0), 0);
    const estabilidade = sobrevivencia + (Number(configBase.retiradaDesejada) || 0);
    const conforto = estabilidade + (Number(configBase.confortoDesejado) || 0);
    return { sobrevivencia, estabilidade, conforto };
  }

  const totalSobrevivencia = metas
    .filter(meta => objetivoMetaSeguro(meta.objetivo) === "sobrevivencia")
    .reduce((soma, meta) => soma + (Number(meta.valor) || 0), 0);
  const totalEstabilidadeDireta = metas
    .filter(meta => objetivoMetaSeguro(meta.objetivo) === "estabilidade")
    .reduce((soma, meta) => soma + (Number(meta.valor) || 0), 0);
  const totalConfortoDireto = metas
    .filter(meta => objetivoMetaSeguro(meta.objetivo) === "conforto")
    .reduce((soma, meta) => soma + (Number(meta.valor) || 0), 0);

  const retirada = Number(configBase.retiradaDesejada) || 0;
  const retiradaObjetivo = objetivoMetaSeguro(configBase.retiradaObjetivo || "estabilidade");
  const retiradaSobrevivencia = retiradaObjetivo === "sobrevivencia" ? retirada : 0;
  const retiradaEstabilidade = retiradaObjetivo === "estabilidade" ? retirada : 0;
  const retiradaConforto = retiradaObjetivo === "conforto" ? retirada : 0;

  const baseCustosEstabilidade = totalSobrevivencia + totalEstabilidadeDireta;
  const baseCustosConforto = baseCustosEstabilidade + totalConfortoDireto;

  const sobrevivencia = totalSobrevivencia + retiradaSobrevivencia;
  const estabilidade = baseCustosEstabilidade + retiradaEstabilidade;
  const conforto = baseCustosConforto + retiradaConforto;
  return { sobrevivencia, estabilidade, conforto };
}

function totaisCustosConfig(configBase = config) {
  const metas = Array.isArray(configBase.metas) ? configBase.metas : [];
  if (!metas.length) {
    return {
      sobrevivencia: (Number(configBase.metaGasolina) || 0) + (Number(configBase.metaSeguro) || 0) + (Number(configBase.metaCustosGerais) || 0),
      estabilidade: 0,
      conforto: Number(configBase.metaParcela) || 0
    };
  }

  if (Number(configBase.modeloMetasVersao) >= 2) {
    return metas.reduce((totais, meta) => {
      totais.sobrevivencia += Number(meta.valor) || 0;
      return totais;
    }, { sobrevivencia: 0, estabilidade: 0, conforto: 0 });
  }

  return metas.reduce((totais, meta) => {
    if (ehMetaSobra(meta)) return totais;
    const objetivo = objetivoMetaSeguro(meta.objetivo);
    totais[objetivo] += Number(meta.valor) || 0;
    return totais;
  }, { sobrevivencia: 0, estabilidade: 0, conforto: 0 });
}

function valorRealizadoMeta(meta, ctx) {
  if (ehMetaSobra(meta)) return 0;
  const nome = String(meta.nome || "").toLowerCase();
  const realizadoPorDescricao = ctx.despesasPorDescricao?.[chaveMeta(meta.nome)];
  if (realizadoPorDescricao !== undefined) return realizadoPorDescricao;
  if (nome.includes("gasolina") || nome.includes("combust") || nome.includes("energia") || nome.includes("recarga")) return ctx.gastoGasolina || 0;
  if (nome.includes("seguro")) return ctx.gastoSeguro || 0;
  if (nome.includes("parcela")) return ctx.gastoParcela || 0;
  if (nome.includes("custo")) return ctx.gastoCustosGerais || 0;
  return 0;
}

function render() {
  migrarMetasConfiguradas();
  atualizarRotulosVeiculo();
  tabela.innerHTML = "";

  let entradas = 0;
  let saidas = 0;
  let litrosTotal = 0;
  let kms = [];

  let gastoGasolina = 0;
  let gastoSeguro = 0;
  let gastoCustosGerais = 0;
  let gastoParcela = 0;
  const despesasPorDescricao = {};

  const diasComGanhos = new Set();

  const dadosOrdenados = [...dados].sort((a, b) => {
    const dataA = a.data || "";
    const dataB = b.data || "";
    if (dataA !== dataB) return dataB.localeCompare(dataA);
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
  const mesAtualKey = mesKeyDeData(new Date());
  const snapMesFechado = fechamentos[mesAtualKey]?.fechadoManual ? fechamentos[mesAtualKey] : null;

  dadosOrdenados.forEach((d, index) => {
    // A lista pode exibir mês atual + anterior, mas os KPIs e o Dashboard são sempre do mês atual.
    // Se o mês foi fechado manualmente, os KPIs zeram para iniciar o próximo ciclo.
    if (obterMesKey(d.data) === mesAtualKey && !snapMesFechado) {
      if (d.valor > 0) {
        entradas += d.valor;
        if (d.descricao === "Ganhos Uber") diasComGanhos.add(d.data);
      }

      if (d.valor < 0) saidas += d.valor;
      if (d.litros) litrosTotal += d.litros;
      if (d.km) kms.push(d.km);

      if (d.valor < 0 && d.descricao) {
        const chave = chaveMeta(descricaoVisivelLancamento(d));
        despesasPorDescricao[chave] = (despesasPorDescricao[chave] || 0) + Math.abs(d.valor);
      }
      if (ehLancamentoEnergia(d)) gastoGasolina += Math.abs(d.valor);
      if (d.descricao === "Seguro") gastoSeguro += Math.abs(d.valor);
      if (d.descricao === "Parcela") gastoParcela += Math.abs(d.valor);

      if (
        d.valor < 0 &&
        !ehLancamentoEnergia(d) &&
        d.descricao !== "Seguro" &&
        d.descricao !== "Parcela"
      ) {
        gastoCustosGerais += Math.abs(d.valor);
      }
    }

    const tr = document.createElement("tr");
    const botaoExcluir = document.createElement("button");
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.innerText = "Excluir";
    botaoExcluir.addEventListener("click", () => excluirPorId(d.id));

    tr.innerHTML = `
      <td data-label="Data">${formatarData(d.data)}</td>
      <td data-label="Descrição"><span class="launch-row"><span class="launch-icon ${classeIconeLancamento(d)}">${svgIconeLancamento(d)}</span><span>${textoSeguro(descricaoVisivelLancamento(d))}</span></span></td>
      <td data-label="Valor" class="${d.valor > 0 ? "positivo" : d.valor < 0 ? "negativo" : ""}">
        ${d.valor === 0 ? "-" : moeda(d.valor)}
      </td>
      <td data-label="${rotulosVeiculo().quantidadeCurta}">${d.litros ? numero(d.litros) : "-"}</td>
      <td data-label="KM">${d.km || "-"}</td>
      <td data-label="Ação"></td>
    `;
    tr.querySelector('td[data-label="Ação"]').appendChild(botaoExcluir);

    tabela.appendChild(tr);
  });

  let kmRodado = 0;
  if (kms.length > 1) kmRodado = Math.max(...kms) - Math.min(...kms);

  const resultadoMes = entradas + saidas;
  const lucroOperacional = entradas + saidas;

  const receitaPorKm = kmRodado > 0 ? entradas / kmRodado : 0;
  const custoPorKm = kmRodado > 0 ? gastoGasolina / kmRodado : 0;
  const lucroPorKm = kmRodado > 0 ? lucroOperacional / kmRodado : 0;

  const totaisMetas = totaisMetasConfig();
  const custosSemParcela = totaisMetas.sobrevivencia;
  const metaConsistenteValor = totaisMetas.estabilidade;
  const custosTotais = totaisMetas.conforto;

  const diasPlanejadosAtual = calcularDiasPlanejadosDoMes(new Date().getFullYear(), new Date().getMonth() + 1, config);
  const diasTrabalhadosValor = snapMesFechado ? 0 : diasComGanhos.size;
  const diasRestantes = snapMesFechado ? 0 : Math.max(diasPlanejadosAtual - diasTrabalhadosValor, 0);

  const mediaDiaValor = diasTrabalhadosValor > 0 ? entradas / diasTrabalhadosValor : 0;
  const metaMinima = diasPlanejadosAtual > 0 ? custosSemParcela / diasPlanejadosAtual : 0;
  const metaIdeal = diasPlanejadosAtual > 0 ? custosTotais / diasPlanejadosAtual : 0;
  const metaAjustadaValor = diasRestantes > 0 ? Math.max((custosSemParcela - entradas) / diasRestantes, 0) : 0;

  if (document.getElementById("diasPlanejadosResumo")) diasPlanejadosResumo.innerText = diasPlanejadosAtual || 0;
  entradasEl().innerText = moeda(entradas);
  saidasEl().innerText = moeda(saidas);
  resultado.innerText = moeda(resultadoMes);
  resultado.classList.toggle("positivo", resultadoMes >= 0);
  resultado.classList.toggle("negativo", resultadoMes < 0);

  kmRodadoEl().innerText = kmRodado.toLocaleString("pt-BR");
  litrosTotalEl().innerText = numero(litrosTotal);
  gastoGasolinaEl().innerText = moedaSaida(gastoGasolina);
  receitaPorKmEl().innerText = moeda(receitaPorKm);
  custoPorKmEl().innerText = moedaSaida(custoPorKm);
  lucroPorKmEl().innerText = moeda(lucroPorKm);

  if (snapMesFechado) {
    const containerComp = document.getElementById("composicaoMetasLista");
    if (containerComp) containerComp.innerHTML = '<div class="meta-empty">Mês fechado — aguardando o próximo ciclo.</div>';
  } else {
    renderizarComposicaoMetas({ gastoGasolina, gastoSeguro, gastoCustosGerais, gastoParcela, entradas, saidas, despesasPorDescricao });
  }

  if (document.getElementById("diasTrabalhados")) diasTrabalhados.innerText = diasTrabalhadosValor;
  if (document.getElementById("mediaDia")) mediaDia.innerText = moeda(mediaDiaValor);
  if (document.getElementById("metaDiariaMinima")) metaDiariaMinima.innerText = moeda(metaMinima);
  if (document.getElementById("metaDiariaIdeal")) metaDiariaIdeal.innerText = moeda(metaIdeal);
  if (document.getElementById("metaAjustada")) metaAjustada.innerText = moeda(metaAjustadaValor);

  atualizarDashboard({
    entradas,
    saidas,
    custosSemParcela,
    custosTotais,
    diasTrabalhadosValor,
    diasRestantes,
    diasPlanejadosAtual,
    mediaDiaValor,
    metaAjustadaValor,
    snapMesFechado
  });

  renderizarMetasConfig();
  renderizarHistoricoMensal({ entradas, saidas, kmRodado, litrosTotal, gastoGasolina, lucroOperacional, custosSemParcela, metaConsistenteValor, custosTotais });
  renderizarBannerMesFechado(snapMesFechado);
  renderizarBannerRevisaoMensal();
}

function renderizarBannerRevisaoMensal() {
  const banner = document.getElementById("dashboardRevisaoMes");
  if (!banner) return;
  const mesAtual = mesKeyDeData(new Date());
  banner.classList.toggle("hidden", config.revisaoMesPendente !== mesAtual);
}

function entradasEl() { return document.getElementById("entradas"); }
function saidasEl() { return document.getElementById("saidas"); }
function kmRodadoEl() { return document.getElementById("kmRodado"); }
function litrosTotalEl() { return document.getElementById("litrosTotal"); }
function gastoGasolinaEl() { return document.getElementById("gastoGasolina"); }
function receitaPorKmEl() { return document.getElementById("receitaPorKm"); }
function custoPorKmEl() { return document.getElementById("custoPorKm"); }
function lucroPorKmEl() { return document.getElementById("lucroPorKm"); }

function renderizarComposicaoMetas(ctx) {
  const container = document.getElementById("composicaoMetasLista");
  if (!container) return;
  migrarMetasConfiguradas();

  if (!config.metas.length) {
    container.innerHTML = '<div class="meta-empty">Nenhum custo cadastrado ainda.</div>';
    return;
  }

  const grupos = Number(config.modeloMetasVersao) >= 2 ? ["sobrevivencia"] : ["sobrevivencia", "estabilidade", "conforto"];
  container.innerHTML = grupos.map(objetivo => {
    const metasDoGrupo = config.metas.filter(meta => objetivoMetaSeguro(meta.objetivo) === objetivo);
    if (!metasDoGrupo.length) return "";

    return `
      <section class="composicao-grupo composicao-${objetivo}">
        <div class="composicao-grupo-titulo">${Number(config.modeloMetasVersao) >= 2 ? "Custos que compõem a Sobrevivência" : rotuloObjetivoMeta(objetivo)}</div>
        <div class="composicao-itens">
          ${metasDoGrupo.map(meta => {
            const valorMeta = Number(meta.valor) || 0;
            const realizado = valorRealizadoMeta(meta, ctx);
            const saldo = valorMeta - realizado;
            const sobraAtual = Math.max((Number(ctx.entradas) || 0) + (Number(ctx.saidas) || 0), 0);
            const saldoSobra = Math.max(valorMeta - sobraAtual, 0);
            const ehSobra = ehMetaSobra(meta);
            return `
              <div class="composicao-item ${ehSobra ? "meta-sobra" : ""}">
                <strong>${textoSeguro(meta.nome)}</strong>
                <div class="composicao-valores">
                  <span class="${ehSobra ? "" : "custo-planejado"}"><small>${ehSobra ? "Desejado" : "Definido"}</small>${moeda(valorMeta)}</span>
                  <span><small>${ehSobra ? "A formar" : "Saldo"}</small>${moeda(ehSobra ? saldoSobra : saldo)}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderizarMetasConfig() {
  const container = document.getElementById("metasLista");
  if (!container) return;
  migrarMetasConfiguradas();
  atualizarResumoMetasConfig();

  if (!config.metas.length) {
    container.innerHTML = '<div class="meta-empty">Nenhuma meta cadastrada ainda.</div>';
    return;
  }

  container.innerHTML = config.metas.map(meta => `
    <div class="meta-config-row">
      <div>
        <strong>${textoSeguro(meta.nome)}</strong>
        <small>${Number(config.modeloMetasVersao) >= 2 ? "Custo essencial" : rotuloObjetivoMeta(meta.objetivo)}</small>
      </div>
      <span class="custo-planejado">${moeda(meta.valor)}</span>
      <div class="meta-config-actions">
        <button type="button" class="btn-editar" data-meta-edit-id="${textoSeguro(meta.id)}">Editar</button>
        <button type="button" class="btn-excluir" data-meta-id="${textoSeguro(meta.id)}">Excluir</button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll("[data-meta-edit-id]").forEach(botao => {
    botao.addEventListener("click", () => iniciarEdicaoMeta(botao.getAttribute("data-meta-edit-id")));
  });

  container.querySelectorAll("[data-meta-id]").forEach(botao => {
    botao.addEventListener("click", () => excluirMeta(botao.getAttribute("data-meta-id")));
  });
}
if (document.getElementById("simMes")) {
  ["simMediaDia", "simCustos", "simRetirada", "simConforto"].forEach(id => {
    const campo = document.getElementById(id);
    campo.addEventListener("input", event => {
      formatarCampoMoedaDigitando(event.target);
      renderizarSimulacao();
    });
    campo.addEventListener("blur", event => {
      formatarCampoMoeda(event.target);
      renderizarSimulacao();
    });
  });
  document.getElementById("simMes").addEventListener("change", atualizarPeriodoSimulacao);
  document.getElementById("simAno").addEventListener("change", atualizarPeriodoSimulacao);
  document.getElementById("simTrabalhoEmFeriados").addEventListener("change", event => {
    garantirSimulacao();
    simulacao.trabalhoEmFeriados = event.target.checked;
    renderizarSimulacao();
  });
  document.querySelectorAll("[data-sim-weekday]").forEach(botao => {
    botao.addEventListener("click", () => alternarDiaSemanaSimulacao(Number(botao.dataset.simWeekday)));
  });
  document.getElementById("simCalendario").addEventListener("click", event => {
    const botao = event.target.closest("[data-sim-date]");
    if (botao) alternarExcecaoSimulacao(botao.dataset.simDate);
  });
}

function atualizarResumoMetasConfig() {
  const retiradaCampo = document.getElementById("retiradaDesejada");
  const confortoCampo = document.getElementById("confortoDesejado");
  const configPrevia = {
    ...config,
    modeloMetasVersao: 2,
    retiradaDesejada: retiradaCampo ? parseMoeda(retiradaCampo.value) : (Number(config.retiradaDesejada) || 0),
    confortoDesejado: confortoCampo ? parseMoeda(confortoCampo.value) : (Number(config.confortoDesejado) || 0)
  };
  const totais = totaisMetasConfig(configPrevia);
  const atualizar = (id, valor) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerText = moeda(valor);
  };
  atualizar("configResumoSobrevivencia", totais.sobrevivencia);
  atualizar("configResumoEstabilidade", totais.estabilidade);
  atualizar("configResumoConforto", totais.conforto);
}

async function excluirMeta(id) {
  config.metas = (Array.isArray(config.metas) ? config.metas : []).filter(meta => String(meta.id) !== String(id));
  if (String(metaEmEdicaoId) === String(id)) resetarFormularioMeta();
  preencherCamposConfig();
  render();
  await salvarEstado();
}

function mostrarModal(titulo, mensagem, labelConfirmar = "Confirmar", labelCancelar = "Cancelar") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    const cancelarHtml = labelCancelar
      ? '<button type="button" class="modal-btn-cancelar secundario">' + textoSeguro(labelCancelar) + '</button>'
      : '';
    overlay.innerHTML = '<div class="modal-box">'
      + '<div class="modal-titulo">' + textoSeguro(titulo) + '</div>'
      + '<div class="modal-mensagem">' + textoSeguro(mensagem) + '</div>'
      + '<div class="modal-acoes">' + cancelarHtml
      + '<button type="button" class="modal-btn-confirmar">' + textoSeguro(labelConfirmar) + '</button>'
      + '</div></div>';
    document.body.appendChild(overlay);
    const fechar = resultado => { overlay.remove(); resolve(resultado); };
    overlay.querySelector(".modal-btn-confirmar").addEventListener("click", () => fechar(true));
    if (labelCancelar) overlay.querySelector(".modal-btn-cancelar").addEventListener("click", () => fechar(false));
    overlay.addEventListener("click", e => { if (e.target === overlay) fechar(false); });
  });
}

async function fecharMesAtualManual() {
  const mesAtual = mesKeyDeData(new Date());
  const confirmado = await mostrarModal(
    "Fechar " + nomeMesAnoLongo(mesAtual) + "?",
    "Os dados do mês serão congelados e o ciclo reiniciará. Para reabrir depois, não pode ter nenhum lançamento novo após o fechamento."
  );
  if (!confirmado) return;
  const totalLancamentos = dados.filter(d => obterMesKey(d.data) === mesAtual).length;
  const resumo = calcularResumoDoMes(mesAtual, dados, config, "Fechado");
  resumo.fechadoManual = true;
  resumo.fechadoEm = new Date().toISOString();
  resumo.totalLancamentos = totalLancamentos;
  fechamentos[mesAtual] = resumo;
  salvarBackupLocal();
  render();
  setStatusSync("Mês fechado", "ok");
  await salvarEstado();
}

async function reabrirMes(mesKey) {
  const snap = fechamentos[mesKey];
  if (!snap) return;
  const lancamentosAtuais = dados.filter(d => obterMesKey(d.data) === mesKey).length;
  const lancamentosNoFechamento = snap.totalLancamentos ?? lancamentosAtuais;
  if (lancamentosAtuais !== lancamentosNoFechamento) {
    await mostrarModal(
      "Não é possível reabrir",
      "Há lançamentos feitos após o fechamento. Exclua-os na aba Lançamentos para poder reabrir o mês.",
      "Entendi",
      ""
    );
    return;
  }
  const confirmado = await mostrarModal(
    "Reabrir " + nomeMesAnoLongo(mesKey) + "?",
    "O mês voltará para aberto e os dados serão descongelados."
  );
  if (!confirmado) return;
  delete fechamentos[mesKey];
  render();
  setStatusSync("Mês reaberto", "ok");
  await salvarEstado();
}

function renderizarBannerMesFechado(snap) {
  ["telaInicio", "telaDashboard"].forEach(id => {
    const tela = document.getElementById(id);
    if (!tela) return;
    const banner = tela.querySelector(".mes-fechado-banner");
    if (banner) banner.remove();
  });
}



function obterMesKey(dataISO) {
  if (!dataISO || typeof dataISO !== "string" || dataISO.length < 7) return "";
  return dataISO.slice(0, 7);
}

function mesKeyDeData(dataObj) {
  const ano = dataObj.getFullYear();
  const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function deslocarMesKey(mesKey, delta) {
  const [ano, mes] = mesKey.split("-").map(Number);
  const data = new Date(ano, mes - 1 + delta, 1);
  return mesKeyDeData(data);
}

function compararMesKey(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a.localeCompare(b);
}

function nomeMesAno(mesKey) {
  if (!mesKey) return "Mês";
  const [ano, mes] = mesKey.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${meses[(mes || 1) - 1]} de ${ano}`;
}

function nomeMesAnoLongo(mesKey) {
  if (!mesKey) return "Mês";
  const [ano, mes] = mesKey.split("-").map(Number);
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${meses[(mes || 1) - 1]} de ${ano}`;
}

function calcularResumoDoMes(mesKey, listaDados, configBase = config, status = "Fechado") {
  const dadosMes = (Array.isArray(listaDados) ? listaDados : []).filter(d => obterMesKey(d.data) === mesKey);
  let entradas = 0;
  let saidas = 0;
  let litrosTotal = 0;
  let kms = [];
  let gastoGasolina = 0;
  let diasComGanhos = new Set();

  const despesasPorDescricao = {};
  dadosMes.forEach(d => {
    const valor = Number(d.valor) || 0;
    if (valor > 0) {
      entradas += valor;
      if (d.descricao === "Ganhos Uber") diasComGanhos.add(d.data);
    }
    if (valor < 0) saidas += valor;
    if (d.litros) litrosTotal += Number(d.litros) || 0;
    if (d.km) kms.push(Number(d.km) || 0);
    if (ehLancamentoEnergia(d)) gastoGasolina += Math.abs(valor);
    if (valor < 0 && d.descricao) {
      const chave = chaveMeta(descricaoVisivelLancamento(d));
      despesasPorDescricao[chave] = (despesasPorDescricao[chave] || 0) + Math.abs(valor);
    }
  });

  const kmRodado = kms.length > 1 ? Math.max(...kms) - Math.min(...kms) : 0;
  const lucroOperacional = entradas + saidas;
  const resultado = lucroOperacional;
  const lucroPorKm = kmRodado > 0 ? lucroOperacional / kmRodado : 0;

  const totaisMetas = totaisMetasConfig(configBase);
  const metaMinima = totaisMetas.sobrevivencia;
  const metaConsistenteValor = totaisMetas.estabilidade;
  const metaIdeal = totaisMetas.conforto;

  let faixaMeta = "Abaixo da mínima";
  if (metaIdeal > 0 && entradas >= metaIdeal) faixaMeta = "Ideal";
  else if (metaConsistenteValor > 0 && entradas >= metaConsistenteValor) faixaMeta = "Consistente";
  else if (metaMinima > 0 && entradas >= metaMinima) faixaMeta = "Mínima";

  return {
    mesKey,
    mesLabel: nomeMesAnoLongo(mesKey),
    status,
    entradas,
    saidas,
    resultado,
    kmRodado,
    litrosTotal,
    gastoGasolina,
    lucroPorKm,
    diasTrabalhados: diasComGanhos.size,
    metaAtingida: faixaMeta,
    config: { ...configBase },
    fechadoEm: status === "Fechado" ? new Date().toISOString() : null,
    despesasPorDescricao
  };
}

function executarManutencaoMensal(forcar = false) {
  const mesAtual = mesKeyDeData(new Date());
  const mesAnterior = deslocarMesKey(mesAtual, -1);
  let alterou = false;

  const mesesNosLancamentos = [...new Set(dados.map(d => obterMesKey(d.data)).filter(Boolean))];

  mesesNosLancamentos.forEach(mesKey => {
    // Todo mês anterior ao mês atual recebe/atualiza um consolidado.
    // Ele pode continuar aparecendo em Lançamentos por mais um mês.
    if (compararMesKey(mesKey, mesAtual) < 0) {
      const tinhaFechamento = !!fechamentos[mesKey];
      const resumo = calcularResumoDoMes(mesKey, dados, config, "Fechado");
      const anterior = JSON.stringify(fechamentos[mesKey] || {});
      const novo = JSON.stringify(resumo);
      if (anterior !== novo) {
        fechamentos[mesKey] = resumo;
        alterou = true;
        if (!tinhaFechamento) config.revisaoMesPendente = mesAtual;
      }
    }
  });

  const tamanhoAntes = dados.length;
  dados = dados.filter(d => {
    const mes = obterMesKey(d.data);
    if (!mes) return true;
    // Mantém na aba Lançamentos apenas mês atual + mês anterior.
    return compararMesKey(mes, mesAnterior) >= 0;
  });

  if (dados.length !== tamanhoAntes) alterou = true;

  if (forcar && alterou) salvarBackupLocal();
  return alterou;
}

function rotuloMetaAtingida(metaAtingida) {
  if (metaAtingida === "Ideal") return "Conforto";
  if (metaAtingida === "Consistente") return "Estabilidade";
  if (metaAtingida === "Mínima") return "Sobrevivência";
  return metaAtingida || "Sem meta";
}

function fraseResultadoMes(entradas, sobrevivencia, estabilidade, conforto) {
  if (conforto > 0 && entradas >= conforto) return "Mandou muito bem! O mês chegou no conforto.";
  if (estabilidade > 0 && entradas >= estabilidade) return "Boa, o mês ficou firme na estabilidade.";
  if (sobrevivencia > 0 && entradas >= sobrevivencia) return "O mês se pagou. Sobrevivência atingida.";
  return "O mês ficou abaixo da mínima.";
}

function buildReguaHistorico(entradas, sobrevivencia, estabilidade, conforto) {
  const maiorMeta = Math.max(sobrevivencia || 0, estabilidade || 0, conforto || 0, entradas || 0, 1);
  const pos = v => (Math.max(0, Math.min(((Number(v) || 0) / maiorMeta) * 100, 100))).toFixed(1);
  const markSobrev = sobrevivencia > 0 ? '<span class="ritmo-mark sobrevivencia" style="left:' + pos(sobrevivencia) + '%"></span>' : '';
  const markEstab = estabilidade > 0 ? '<span class="ritmo-mark estabilidade" style="left:' + pos(estabilidade) + '%"></span>' : '';
  const markConfort = conforto > 0 ? '<span class="ritmo-mark conforto" style="left:' + pos(conforto) + '%"></span>' : '';
  const legSobrev = sobrevivencia > 0 ? '<span style="left:' + pos(sobrevivencia) + '%">Sobrevivência</span>' : '';
  const legEstab = estabilidade > 0 ? '<span style="left:' + pos(estabilidade) + '%">Estabilidade</span>' : '';
  const legConfort = conforto > 0 ? '<span style="left:' + pos(conforto) + '%">Conforto</span>' : '';
  return '<div class="ritmo-meter hist-regua"><div class="ritmo-regua"><div class="ritmo-track">'
    + '<span class="ritmo-mark zero" style="left:0%"></span>'
    + markSobrev + markEstab + markConfort
    + '<span class="ritmo-projecao hist-resultado" style="left:' + pos(entradas) + '%"><small>Resultado</small></span>'
    + '</div></div></div>'
    + '<div class="ritmo-legenda"><span style="left:0%">0</span>' + legSobrev + legEstab + legConfort + '</div>';
}

function buildMetaCardsHistorico(entradas, sobrevivencia, estabilidade, conforto) {
  const buildCard = (label, meta, classe) => {
    if (!(meta > 0)) return '';
    const pct = Math.min(Math.round((entradas / meta) * 100), 999);
    const pctBar = Math.min(pct, 100);
    const atingiu = entradas >= meta;
    return '<div class="month-mini-meta ' + classe + (atingiu ? ' ok' : ' miss') + '">'
      + '<div class="month-mini-meta-nome">' + label + '</div>'
      + '<div class="month-mini-meta-valor">' + moeda(meta) + '</div>'
      + '<div class="month-mini-meta-bar"><div class="month-mini-meta-fill" style="width:' + pctBar + '%"></div></div>'
      + '<div class="month-mini-meta-pct">' + pct + '%' + (atingiu ? ' ✓' : '') + '</div>'
      + '</div>';
  };
  const html = buildCard('Sobrevivência', sobrevivencia, 'sobrev')
    + buildCard('Estabilidade', estabilidade, 'estab')
    + buildCard('Conforto', conforto, 'confort');
  return html ? '<div class="month-mini-meta-grid">' + html + '</div>' : '';
}

function buildComposicaoHistorico(resumo) {
  const metas = Array.isArray(resumo.config && resumo.config.metas ? resumo.config.metas : null)
    ? resumo.config.metas : [];
  const custos = metas.filter(m => !ehMetaSobra(m) && Number(m.valor) > 0);
  const despesas = resumo.despesasPorDescricao;
  if (!custos.length || !despesas) return '';
  const itens = custos.map(meta => {
    const gasto = despesas[chaveMeta(meta.nome)] || 0;
    const pct = meta.valor > 0 ? Math.min((gasto / meta.valor) * 100, 100).toFixed(1) : 0;
    const acima = gasto > Number(meta.valor);
    return '<div class="month-custo-row">'
      + '<span class="month-custo-nome">' + textoSeguro(meta.nome) + '</span>'
      + '<div class="month-custo-barra"><div class="month-custo-fill' + (acima ? ' acima' : '') + '" style="width:' + pct + '%"></div></div>'
      + '<span class="month-custo-valores">' + moedaSaida(gasto) + ' <small>/ ' + moeda(meta.valor) + '</small></span>'
      + '</div>';
  }).join('');
  if (!itens) return '';
  return '<div class="month-composicao"><div class="month-composicao-titulo">Custos do mês</div>' + itens + '</div>';
}

function renderizarHistoricoMensal(ctx = {}) {
  const container = document.getElementById("historicoMesesLista");
  if (!container) return;

  const mesAtual = mesKeyDeData(new Date());
  const meses = new Set(Object.keys(fechamentos || {}));
  meses.add(mesAtual);

  // Se houver lançamentos recentes ainda visíveis, exibe também o consolidado calculado.
  dados.forEach(d => {
    const mes = obterMesKey(d.data);
    if (mes) meses.add(mes);
  });

  const lista = [...meses].filter(Boolean).sort((a, b) => b.localeCompare(a));

  if (lista.length === 0) {
    container.innerHTML = `<div class="history-empty">Sem dados mensais para exibir ainda.</div>`;
    atualizarResumoHistorico([]);
    return;
  }

  const resumos = lista.map(mesKey => {
    const fechamentoSalvo = fechamentos[mesKey];
    const mesAtualFechado = mesKey === mesAtual && fechamentoSalvo?.fechadoManual;
    const status = mesKey === mesAtual && !mesAtualFechado ? "Em andamento" : "Fechado";
    const resumo = mesKey === mesAtual
      ? (mesAtualFechado ? fechamentoSalvo : calcularResumoDoMes(mesKey, dados, config, status))
      : (fechamentoSalvo || calcularResumoDoMes(mesKey, dados, config, status));
    return { mesKey, status, resumo };
  });

  atualizarResumoHistorico(resumos.map(item => item.resumo));
  container.innerHTML = "";

  resumos.forEach(({ mesKey, status, resumo }) => {
    const statusClasse = status === "Em andamento" ? "andamento" : "fechado";
    const metaClasse = classeMetaHistorico(resumo.metaAtingida);
    const totaisMetas = totaisMetasConfig(resumo.config || {});
    const metaMinima = totaisMetas.sobrevivencia;
    const metaConsistente = totaisMetas.estabilidade;
    const metaIdeal = totaisMetas.conforto;
    const metaReferencia = Math.max(metaIdeal, metaConsistente, metaMinima, resumo.entradas || 0, 1);
    const progresso = numeroPercentualSeguro(((resumo.entradas || 0) / metaReferencia) * 100);
    const diasTexto = (resumo.diasTrabalhados || 0) === 1 ? "1 dia trabalhado" : `${resumo.diasTrabalhados || 0} dias trabalhados`;
    const saidasAbs = Math.abs(Number(resumo.saidas) || 0);
    const statusLabel = rotuloMetaAtingida(resumo.metaAtingida);
    const statusTexto = statusLabel === "Abaixo da mínima" ? "Abaixo da mínima" : `Faixa ${statusLabel.toLowerCase()}`;

    const rotulosHistorico = rotulosVeiculo(resumo.config || config);

    const mediaDiaCard = (resumo.diasTrabalhados || 0) > 0 ? resumo.entradas / resumo.diasTrabalhados : 0;
    const receitaPorKmCard = (resumo.kmRodado || 0) > 0 ? resumo.entradas / resumo.kmRodado : 0;
    const custoPorKmCard = (resumo.kmRodado || 0) > 0 ? (resumo.gastoGasolina || 0) / resumo.kmRodado : 0;
    const frase = fraseResultadoMes(resumo.entradas, metaMinima, metaConsistente, metaIdeal);
    const reguaHtml = buildReguaHistorico(resumo.entradas, metaMinima, metaConsistente, metaIdeal);
    const metaCardsHtml = buildMetaCardsHistorico(resumo.entradas, metaMinima, metaConsistente, metaIdeal);
    const composicaoHtml = buildComposicaoHistorico(resumo);
    const podReabrir = mesKey === mesAtual && !!fechamentos[mesKey]?.fechadoManual;
    const reabrirHtml = podReabrir ? '<button type="button" class="btn-reabrir-mes">Reabrir mês</button>' : '';

    const card = document.createElement("div");
    card.className = `month-card-premium ${statusClasse} ${metaClasse}`;
    card.innerHTML = `
      <div class="month-card-head">
        <div class="month-title-wrap">
          <div class="month-icon">${iconeCalendario()}</div>
          <div>
            <div class="month-title">${textoSeguro(resumo.mesLabel || nomeMesAnoLongo(mesKey))}</div>
            <div class="month-sub">${textoSeguro(diasTexto)} · ${textoSeguro(statusTexto)}</div>
          </div>
        </div>
        <div class="month-badges">
          <span class="month-badge ${statusClasse}">${textoSeguro(status)}</span>
          <span class="month-badge ${metaClasse}">${textoSeguro(statusLabel)}</span>
        </div>
      </div>
      <div class="month-sections">
        <div class="month-conquista ${metaClasse}">${textoSeguro(frase)}</div>
        <div class="month-result-panel">
          <div class="month-result-label">Resultado do mês</div>
          <div class="month-result-value ${resumo.resultado >= 0 ? "positivo" : "negativo"}">${moeda(resumo.resultado)}</div>
          <div class="month-result-note">${moeda(resumo.entradas)} em ganhos · ${moedaSaida(saidasAbs)} em saídas</div>
          ${reguaHtml}
        </div>
        ${metaCardsHtml}
        <div class="month-kpi-grid">
          <div class="month-kpi"><span>Entradas</span><strong class="positivo">${moeda(resumo.entradas)}</strong><small>Ganhos Uber</small></div>
          <div class="month-kpi"><span>Saídas</span><strong class="negativo">${moedaSaida(saidasAbs)}</strong><small>Custos lançados</small></div>
          <div class="month-kpi"><span>Média por dia</span><strong>${moeda(mediaDiaCard)}</strong><small>${resumo.diasTrabalhados || 0} dia(s) trabalhado(s)</small></div>
          <div class="month-kpi"><span>KM rodado</span><strong>${Math.round(resumo.kmRodado || 0).toLocaleString("pt-BR")}</strong><small>${numero(resumo.litrosTotal || 0)} ${rotulosHistorico.resumoQuantidadeHistorico}</small></div>
          <div class="month-kpi"><span>Receita/KM</span><strong>${moeda(receitaPorKmCard)}</strong><small>Ganho por quilômetro</small></div>
          <div class="month-kpi"><span>Custo/KM</span><strong>${moedaSaida(custoPorKmCard)}</strong><small>Energia por quilômetro</small></div>
          <div class="month-kpi"><span>Lucro/KM</span><strong>${moeda(resumo.lucroPorKm)}</strong><small>Resultado por km</small></div>
          <div class="month-kpi"><span>Resultado</span><strong class="${resumo.resultado >= 0 ? "positivo" : "negativo"}">${moeda(resumo.resultado)}</strong><small>Ganhos − custos</small></div>
        </div>
        ${composicaoHtml}
        ${reabrirHtml}
      </div>
    `;
    if (podReabrir) {
      card.querySelector(".btn-reabrir-mes").addEventListener("click", () => reabrirMes(mesKey));
    }
    container.appendChild(card);
  });
}

function classeMetaHistorico(meta) {
  if (meta === "Ideal") return "meta-ideal";
  if (meta === "Consistente") return "meta-consistente";
  if (meta === "Mínima") return "meta-minima";
  return "meta-baixa";
}

function atualizarResumoHistorico(resumos) {
  const melhorEl = document.getElementById("historicoMelhorMes");
  const acumuladoEl = document.getElementById("historicoAcumulado");
  const totalEl = document.getElementById("historicoTotalMeses");
  if (!melhorEl || !acumuladoEl || !totalEl) return;

  if (!resumos || resumos.length === 0) {
    melhorEl.innerText = "—";
    acumuladoEl.innerText = moeda(0);
    totalEl.innerText = "0";
    return;
  }

  const acumulado = resumos.reduce((soma, r) => soma + (Number(r.resultado) || 0), 0);
  const melhor = [...resumos].sort((a, b) => (Number(b.resultado) || 0) - (Number(a.resultado) || 0))[0];

  melhorEl.innerText = melhor ? nomeMesAno(melhor.mesKey || "") : "—";
  acumuladoEl.innerText = moeda(acumulado);
  totalEl.innerText = String(resumos.length);
}

function iconeCalendario() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>`;
}

function metaProjetadaStatus(projecao, sobrevivencia, estabilidade, conforto) {
  if (conforto > 0 && projecao >= conforto) return "Mandou muito bem, o mês chegou no conforto.";
  if (estabilidade > 0 && projecao >= estabilidade) return "Boa, o mês está firme. Agora é buscar conforto.";
  if (sobrevivencia > 0 && projecao >= sobrevivencia) return "Parabéns, o mês tá pago. Bora buscar estabilidade.";
  return "O mês ainda não se pagou. A primeira missão é chegar na sobrevivência.";
}

function proximaMetaAtiva(valor, sobrevivencia, estabilidade, conforto) {
  if (sobrevivencia > 0 && valor < sobrevivencia) return { nome: "Sobrevivência", acao: "Para cobrir os custos", valor: sobrevivencia };
  if (estabilidade > 0 && valor < estabilidade) return { nome: "Estabilidade", acao: "Para alcançar estabilidade", valor: estabilidade };
  if (conforto > 0 && valor < conforto) return { nome: "Conforto", acao: "Para alcançar conforto", valor: conforto };
  return null;
}

function atualizarReguaRitmo(projecao, sobrevivencia, estabilidade, conforto) {
  const maiorMeta = Math.max(sobrevivencia || 0, estabilidade || 0, conforto || 0, 1);
  const pos = valor => Math.max(0, Math.min(((Number(valor) || 0) / maiorMeta) * 100, 100));
  const setLeft = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.style.left = `${pos(value)}%`;
  };
  setLeft("marcaZero", 0);
  setLeft("marcaSobrevivencia", sobrevivencia);
  setLeft("marcaEstabilidade", estabilidade);
  setLeft("marcaConforto", conforto);
  setLeft("faixaZero", 0);
  setLeft("faixaMinima", sobrevivencia);
  setLeft("faixaConsistente", estabilidade);
  setLeft("faixaIdeal", conforto);
  const marcador = document.getElementById("ritmoProjecaoMarcador");
  if (marcador) marcador.style.left = `${pos(projecao)}%`;
}

function metaIcone(nome) {
  const icons = {
    Minima: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
    Consistente: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    Ideal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18"/><path d="M6 4h11l-2 4 2 4H6"/></svg>'
  };
  return icons[nome] || icons.Minima;
}

function obterMelhorDiaSemanaAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
  const ganhosPorDia = {};

  dados.forEach(item => {
    if (item.descricao !== "Ganhos Uber" || Number(item.valor) <= 0 || !item.data) return;
    const partes = item.data.split("-").map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return;
    const data = new Date(partes[0], partes[1] - 1, partes[2]);
    if (data < inicio || data > fim) return;
    ganhosPorDia[item.data] = (ganhosPorDia[item.data] || 0) + Number(item.valor);
  });

  const melhor = Object.entries(ganhosPorDia).sort((a, b) => b[1] - a[1])[0];
  return melhor ? { data: melhor[0], valor: melhor[1] } : null;
}

function atualizarDashboard(ctx) {
  if (!document.getElementById("dashboardProjecao")) return;

  const entradas = ctx.entradas || 0;
  const saidas = ctx.saidas || 0;
  const custosSemParcela = ctx.custosSemParcela || 0;
  const custosTotais = ctx.custosTotais || 0;
  const diasTrabalhadosValor = ctx.diasTrabalhadosValor || 0;
  const diasRestantes = ctx.diasRestantes || 0;
  const diasPlanejadosAtual = ctx.diasPlanejadosAtual || 0;
  const mediaDiaValor = ctx.mediaDiaValor || 0;

  const metaConsistenteValor = totaisMetasConfig().estabilidade;
  const custosBaseSobra = totaisCustosConfig().sobrevivencia;

  const projecaoMes = mediaDiaValor * diasPlanejadosAtual;
  const custosAtuais = Math.abs(saidas);
  const baseRetiradaPrevista = Math.max(custosBaseSobra, custosAtuais);
  const sobraProjetada = projecaoMes - baseRetiradaPrevista;
  
  dashboardProjecao.innerText = moeda(projecaoMes);
  if (document.getElementById("dashboardAtualMes")) dashboardAtualMes.innerText = moeda(entradas);
  if (document.getElementById("dashboardSobraProjetada")) dashboardSobraProjetada.innerText = moeda(sobraProjetada);
  if (document.getElementById("dashboardSobraBase")) {
    dashboardSobraBase.innerText = custosAtuais > custosBaseSobra
      ? `Custos já lançados: ${moedaSaida(custosAtuais)}`
      : `Custos base: ${moeda(baseRetiradaPrevista)}`;
  }
  const sobraBox = document.querySelector(".dashboard-sobra-box");
  if (sobraBox) {
    sobraBox.classList.toggle("positiva", sobraProjetada >= 0);
    sobraBox.classList.toggle("negativa", sobraProjetada < 0);
  }
  dashboardProjecaoSub.innerText = diasTrabalhadosValor > 0
    ? `Baseada em ${diasTrabalhadosValor} dia(s) trabalhado(s), média de ${moeda(mediaDiaValor)}`
    : "Comece registrando seus ganhos para gerar projeção";

  const statusTexto = diasTrabalhadosValor > 0
    ? metaProjetadaStatus(projecaoMes, custosSemParcela, metaConsistenteValor, custosTotais)
    : "Aguardando lançamentos";
  dashboardStatus.innerText = statusTexto;

  atualizarReguaRitmo(projecaoMes, custosSemParcela, metaConsistenteValor, custosTotais);
  faixaTexto.innerText = diasTrabalhadosValor > 0
    ? `Projeção: ${moeda(projecaoMes)}. ${statusTexto}`
    : "Registre ganhos para calcular o ritmo do mês.";

  faixaMinima.innerText = `Sobrevivência ${moeda(custosSemParcela)}`;
  const proximaMetaResumo = proximaMetaAtiva(projecaoMes, custosSemParcela, metaConsistenteValor, custosTotais);
  if (diasTrabalhadosValor > 0) {
    faixaTexto.innerText = proximaMetaResumo
      ? `Projeção ${moeda(projecaoMes)} · próximo marco: ${proximaMetaResumo.nome} (${moeda(proximaMetaResumo.valor)})`
      : `Projeção ${moeda(projecaoMes)} · acima da faixa de conforto`;
  }

  faixaConsistente.innerText = `Estabilidade ${moeda(metaConsistenteValor)}`;
  faixaIdeal.innerText = `Conforto ${moeda(custosTotais)}`;

  atualizarMetaCard("Minima", "Sobrevivência", custosSemParcela, entradas, diasRestantes);
  atualizarMetaCard("Consistente", "Estabilidade", metaConsistenteValor, entradas, diasRestantes);
  atualizarMetaCard("Ideal", "Conforto", custosTotais, entradas, diasRestantes);

  dashMediaDia.innerText = moeda(mediaDiaValor);
  dashMediaSub.innerText = diasTrabalhadosValor > 0 ? `${diasTrabalhadosValor} dia(s) trabalhado(s)` : "sem ganhos registrados";
  const proximaMeta = proximaMetaAtiva(entradas, custosSemParcela, metaConsistenteValor, custosTotais);
  const metaAjustadaCard = dashMetaAjustada.closest(".kpi-card");
  if (proximaMeta) {
    const valorDiaNecessario = diasRestantes > 0 ? Math.max((proximaMeta.valor - entradas) / diasRestantes, 0) : 0;
    metaAjustadaCard.style.display = "";
    dashProximaMetaLabel.innerText = proximaMeta.acao;
    dashMetaAjustada.innerHTML = `<span class="daily-value">${moeda(valorDiaNecessario)}</span><span class="daily-unit">/dia</span>`;
    dashMetaAjustada.parentElement.querySelector("p").innerText = `${proximaMeta.nome} · ${diasRestantes} dia(s) restantes`;
  } else {
    metaAjustadaCard.style.display = "none";
  }

  const semanas = calcularSemanasDoMes(!!ctx.snapMesFechado);
  const metaSemanalBase = proximaMeta || { nome: "Conforto", valor: custosTotais };
  const metaSemanal = metaSemanalBase.valor > 0 ? metaSemanalBase.valor / Math.max(semanas.length, 1) : 0;
  const semanaAtual = semanas.find(s => s.isAtual) || semanas[0] || { valor: 0 };
  const ganhoSemanaAtual = semanaAtual.valor || 0;
  const percSemana = metaSemanal > 0 ? Math.min((ganhoSemanaAtual / metaSemanal) * 100, 999) : 0;

  if (document.getElementById("dashSemanaExecutadoValor")) dashSemanaExecutadoValor.innerText = moeda(ganhoSemanaAtual);
  if (document.getElementById("dashMetaSemana")) dashMetaSemana.innerText = `Meta semanal: ${moeda(metaSemanal)}`;
  if (document.getElementById("dashSemanaStatus")) dashSemanaStatus.innerText = `${Math.round(percSemana)}%`;
  if (document.getElementById("dashSemanaLabel")) dashSemanaLabel.innerText = "Ritmo da semana";
  if (document.getElementById("dashSemanaFalta")) {
    const faltaSemana = Math.max(metaSemanal - ganhoSemanaAtual, 0);
    dashSemanaFalta.innerText = metaSemanal > 0
      ? (faltaSemana > 0 ? `Faltam ${moeda(faltaSemana)} nesta semana` : "Meta semanal atingida")
      : "Configure as metas";
  }
  const melhorDia = obterMelhorDiaSemanaAtual();
  if (document.getElementById("dashMelhorDiaValor")) dashMelhorDiaValor.innerText = melhorDia ? moeda(melhorDia.valor) : "—";
  if (document.getElementById("dashMelhorDiaLabel")) {
    dashMelhorDiaLabel.innerText = melhorDia ? `${formatarData(melhorDia.data)} · seu melhor resultado` : "Registre ganhos nesta semana";
  }

  const metaSemanalSemanasDoMes = metaConsistenteValor > 0 ? metaConsistenteValor / Math.max(semanas.length, 1) : 0;
  renderizarSemanas(semanas, metaSemanalSemanasDoMes);
}

function atualizarMetaCard(nome, rotulo, meta, atual, diasRestantes) {
  const card = document.getElementById(`cardMeta${nome}`);
  const pctEl = document.getElementById(`dashPct${nome}`);
  const barEl = document.getElementById(`dashBar${nome}`);
  const progressoEl = document.getElementById(`dashProgresso${nome}`);
  const acaoEl = document.getElementById(`dashAcao${nome}`);

  if (!card || !pctEl || !barEl || !progressoEl || !acaoEl) return;

  card.classList.remove("ok", "alerta", "longe");

  if (!meta || meta <= 0) {
    pctEl.innerText = "—";
    barEl.style.width = "0%";
    progressoEl.innerHTML = `<div class="meta-line"><span>Executado</span><strong>${moeda(atual)}</strong></div>`;
    acaoEl.innerHTML = `<div class="meta-action-panel"><span class="meta-action-icon">${metaIcone(nome)}</span><span><strong>Meta não configurada</strong><small>Configure esta meta para acompanhar o ritmo.</small></span></div>`;
    card.classList.add("alerta");
    return;
  }

  const percentualExecutado = (atual / meta) * 100;
  const percentualVisual = Math.min(Math.max(percentualExecutado, 0), 100);
  const faltaAtual = Math.max(meta - atual, 0);
  const acima = Math.max(atual - meta, 0);
  const valorDiaNecessario = diasRestantes > 0 ? faltaAtual / diasRestantes : 0;

  pctEl.innerText = `${Math.round(percentualExecutado)}%`;
  barEl.style.width = `${percentualVisual}%`;
  progressoEl.innerHTML = `
    <div class="meta-line"><span>Meta</span><strong>${moeda(meta)}</strong></div>
    <div class="meta-line"><span>Executado</span><strong>${moeda(atual)} · ${Math.round(percentualExecutado)}%</strong></div>
    <div class="meta-line"><span>Faltam</span><strong>${moeda(faltaAtual)}</strong></div>
  `;

  if (faltaAtual <= 0) {
    acaoEl.innerHTML = `<div class="meta-action-panel"><span class="meta-action-icon">${metaIcone(nome)}</span><span><strong>${rotulo} alcançada</strong><small>+${moeda(acima)} acima da meta</small></span></div>`;
    card.classList.add("ok");
  } else {
    const textoDia = diasRestantes > 0 ? `${moeda(valorDiaNecessario)}/dia` : "Sem dias planejados";
    const detalhe = diasRestantes > 0 ? `nos ${diasRestantes} dia(s) planejado(s) restantes` : `para alcançar ${rotulo}`;
    acaoEl.innerHTML = `<div class="meta-action-panel"><span class="meta-action-icon">${metaIcone(nome)}</span><span><strong>${textoDia}</strong><small>${detalhe}</small></span></div>`;
    card.classList.add(percentualExecutado >= 70 ? "alerta" : "longe");
  }
}

function inicioDaSemanaSegunda(dataObj) {
  const d = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
  const diaSemana = d.getDay(); // 0 domingo, 1 segunda...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  return d;
}

function fimDaSemanaDomingo(dataObj) {
  const inicio = inicioDaSemanaSegunda(dataObj);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  return fim;
}

function formatarPeriodoSemana(inicio, fim) {
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesmoMes = inicio.getMonth() === fim.getMonth();
  if (mesmoMes) return `${inicio.getDate()}–${fim.getDate()} ${meses[fim.getMonth()]}`;
  return `${inicio.getDate()} ${meses[inicio.getMonth()]}–${fim.getDate()} ${meses[fim.getMonth()]}`;
}

function chaveSemana(dataObj) {
  const inicio = inicioDaSemanaSegunda(dataObj);
  return inicio.toISOString().slice(0, 10);
}

function calcularSemanasDoMes(ignorarDados = false) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const primeiroDiaMes = new Date(ano, mes, 1);
  const ultimoDiaMes = new Date(ano, mes + 1, 0);
  const primeiraSegundaDoCiclo = inicioDaSemanaSegunda(primeiroDiaMes);
  const semanas = [];

  let cursor = new Date(primeiraSegundaDoCiclo);
  let numeroSemana = 1;

  while (cursor <= ultimoDiaMes) {
    const inicioCalendario = new Date(cursor);
    const fimCalendario = fimDaSemanaDomingo(inicioCalendario);

    // Recorte visual dentro do mês atual: nunca mostra dias do mês anterior/posterior.
    const inicioRecortado = inicioCalendario < primeiroDiaMes ? new Date(primeiroDiaMes) : new Date(inicioCalendario);
    const fimRecortado = fimCalendario > ultimoDiaMes ? new Date(ultimoDiaMes) : new Date(fimCalendario);

    semanas.push({
      key: chaveSemana(inicioCalendario),
      inicio: inicioRecortado,
      fim: fimRecortado,
      label: `S${numeroSemana}: ${formatarPeriodoSemana(inicioRecortado, fimRecortado)}`,
      valor: 0,
      isAtual: chaveSemana(inicioCalendario) === chaveSemana(hoje)
    });

    cursor.setDate(cursor.getDate() + 7);
    numeroSemana++;
  }

  if (!ignorarDados) {
    dados.forEach(d => {
      if (d.descricao !== "Ganhos Uber" || !d.data) return;
      const partes = d.data.split("-");
      if (partes.length !== 3) return;
      const dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
      if (dataObj.getFullYear() !== ano || dataObj.getMonth() !== mes) return;
      const key = chaveSemana(dataObj);
      const semana = semanas.find(s => s.key === key);
      if (semana) semana.valor += Number(d.valor) || 0;
    });
  }

  return semanas;
}

function renderizarSemanas(semanas, metaSemanal) {
  if (!dashSemanasLista) return;

  dashSemanasLista.innerHTML = "";
  semanas.forEach((semana, idx) => {
    const valor = semana.valor || 0;
    const pct = metaSemanal > 0 ? Math.min((valor / metaSemanal) * 100, 100) : 0;
    const linha = document.createElement("div");
    linha.className = "semana-linha";
    linha.innerHTML = `
      <span>${semana.label}</span>
      <div class="semana-barra"><div style="width:${pct}%"></div></div>
      <span class="semana-valor">${valor > 0 ? moeda(valor) : "—"}</span>
    `;
    dashSemanasLista.appendChild(linha);
  });
}



function classeIconeLancamento(item) {
  if (item.tipo === "ganho" || item.descricao === "Ganhos Uber") return "ganho-icon";
  if (ehLancamentoEnergia(item)) return "gasolina-icon";
  if (item.tipo === "km" || item.descricao === "Atualização de KM") return "km-icon";
  return "despesa-icon";
}

function svgIconeLancamento(item) {
  if (item.tipo === "ganho" || item.descricao === "Ganhos Uber") {
    return '<svg class="icon" viewBox="0 0 24 24"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
  }
  if (ehLancamentoEnergia(item)) {
    return '<svg class="icon" viewBox="0 0 24 24"><path d="M4 20V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14"/><path d="M4 10h11"/><path d="M15 7h2l3 3v7a2 2 0 0 1-2 2h-1"/></svg>';
  }
  if (item.tipo === "km" || item.descricao === "Atualização de KM") {
    return '<svg class="icon" viewBox="0 0 24 24"><path d="M5 16h14"/><path d="M7 16l1.2-5.2A3 3 0 0 1 11.1 8h1.8a3 3 0 0 1 2.9 2.8L17 16"/><path d="M7 16v2"/><path d="M17 16v2"/></svg>';
  }
  return '<svg class="icon" viewBox="0 0 24 24"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-3 2V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>';
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function limitarTexto(valor, tamanho = 80) {
  return String(valor ?? "").trim().slice(0, tamanho);
}

function normalizarTipo(valor) {
  const tipoNormalizado = limitarTexto(valor, 20);
  return ["ganho", "gasolina", "despesas", "km", "credito", "debito"].includes(tipoNormalizado)
    ? tipoNormalizado
    : "";
}

function normalizarDataISO(valor) {
  const dataNormalizada = limitarTexto(valor, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada) ? dataNormalizada : "";
}

function normalizarDados() {
  dados = (Array.isArray(dados) ? dados : []).map(item => ({
    id: item.id ? String(item.id) : gerarId(),
    data: normalizarDataISO(item.data),
    tipo: normalizarTipo(item.tipo),
    descricao: limitarTexto(item.descricao),
    valor: Number(item.valor) || 0,
    litros: item.litros !== undefined && item.litros !== null && item.litros !== "" ? Number(item.litros) : null,
    km: item.km !== undefined && item.km !== null && item.km !== "" ? Number(item.km) : null
  }));
}

function normalizarConfigAtual() {
  config.saldoInicial = 0;
  config.metaGasolina = Number(config.metaGasolina) || 0;
  config.metaSeguro = Number(config.metaSeguro) || 0;
  config.metaCustosGerais = Number(config.metaCustosGerais) || 0;
  config.metaParcela = Number(config.metaParcela) || 0;
  config.diasPlanejados = Number(config.diasPlanejados) || 0;
  config.metaConsistente = Number(config.metaConsistente) || 0;
  config.tipoVeiculo = tipoVeiculoSeguro(config.tipoVeiculo);
  config.retiradaDesejada = Number(config.retiradaDesejada) || 0;
  config.retiradaObjetivo = "estabilidade";
  config.confortoDesejado = Number(config.confortoDesejado) || 0;
  config.diasSemana = [...new Set((Array.isArray(config.diasSemana) ? config.diasSemana : [])
    .map(Number)
    .filter(dia => dia >= 1 && dia <= 7))].sort((a, b) => a - b);
  config.trabalhoEmFeriados = !!config.trabalhoEmFeriados;
  config.diasFolgaExtra = (Array.isArray(config.diasFolgaExtra) ? config.diasFolgaExtra : []).map(normalizarDataISO).filter(Boolean);
  config.diasTrabalhoExtra = (Array.isArray(config.diasTrabalhoExtra) ? config.diasTrabalhoExtra : []).map(normalizarDataISO).filter(Boolean);
  config.modeloMetasVersao = Number(config.modeloMetasVersao) || 1;
  migrarMetasConfiguradas();
}

async function excluirPorId(id) {
  if (!confirm("Excluir este lançamento?")) return;

  const antes = dados.length;
  dados = dados.filter(item => String(item.id) !== String(id));

  if (dados.length === antes) {
    alert("Não encontrei este lançamento para excluir. Atualize a página e tente novamente.");
    return;
  }

  render();
  await salvarEstado();
}

function moeda(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function moedaSaida(valor) {
  return moeda(Math.abs(Number(valor) || 0) * -1);
}

function numero(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parseMoeda(valor) {
  if (!valor) return 0;

  let limpo = valor
    .toString()
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return parseFloat(limpo) || 0;
}

function parseDecimalBR(valor) {
  if (!valor) return 0;

  const texto = valor
    .toString()
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return parseFloat(texto) || 0;
}

function formatarCampoDecimalDireto(campo) {
  const digitos = String(campo.value || "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digitos) {
    campo.value = "";
    return;
  }
  campo.value = (Number(digitos) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarCampoMoeda(campo) {
  const valor = parseMoeda(campo.value);
  campo.value = valor ? moeda(valor) : "";
}

function formatarCampoMoedaDigitando(campo) {
  const digitos = String(campo.value || "").replace(/\D/g, "");
  if (!digitos) {
    campo.value = "";
    return;
  }

  const centavos = Number.parseInt(digitos, 10);
  campo.value = moeda(centavos / 100);
}

function rotinaConfigurada(configBase = config) {
  return Array.isArray(configBase.diasSemana) && configBase.diasSemana.length > 0;
}

function dataISOCalendario(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function adicionarDias(data, dias) {
  const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function feriadosNacionais(ano) {
  const fixos = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"];
  const sextaSanta = adicionarDias(calcularPascoa(ano), -2);
  return new Set([
    ...fixos.map(data => `${ano}-${data}`),
    dataISOCalendario(sextaSanta.getFullYear(), sextaSanta.getMonth() + 1, sextaSanta.getDate())
  ]);
}

function diaEhTrabalho(data, configBase = config) {
  if (!rotinaConfigurada(configBase)) return false;
  const dataISO = dataISOCalendario(data.getFullYear(), data.getMonth() + 1, data.getDate());
  const feriado = feriadosNacionais(data.getFullYear()).has(dataISO);
  let trabalha = configBase.diasSemana.includes(data.getDay() || 7);
  if (feriado && !configBase.trabalhoEmFeriados) trabalha = false;
  if (configBase.diasFolgaExtra.includes(dataISO)) trabalha = false;
  if (configBase.diasTrabalhoExtra.includes(dataISO)) trabalha = true;
  return trabalha;
}

function diaEhTrabalhoBase(data, configBase = config) {
  if (!rotinaConfigurada(configBase)) return false;
  const dataISO = dataISOCalendario(data.getFullYear(), data.getMonth() + 1, data.getDate());
  return configBase.diasSemana.includes(data.getDay() || 7)
    && (!feriadosNacionais(data.getFullYear()).has(dataISO) || configBase.trabalhoEmFeriados);
}

function calcularDiasPlanejadosDoMes(ano, mes, configBase = config) {
  if (!rotinaConfigurada(configBase)) return Number(configBase.diasPlanejados) || 0;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let total = 0;
  for (let dia = 1; dia <= ultimoDia; dia++) {
    if (diaEhTrabalho(new Date(ano, mes - 1, dia), configBase)) total++;
  }
  return total;
}

function atualizarDiasPlanejadosDaRotina() {
  if (!rotinaConfigurada()) return;
  config.diasPlanejados = calcularDiasPlanejadosDoMes(new Date().getFullYear(), new Date().getMonth() + 1, config);
}

function alternarDiaSemana(dia) {
  const dias = new Set(Array.isArray(config.diasSemana) ? config.diasSemana : []);
  if (dias.has(dia)) dias.delete(dia);
  else dias.add(dia);
  config.diasSemana = [...dias].sort((a, b) => a - b);
  atualizarDiasPlanejadosDaRotina();
  renderizarRotinaMensal();
  render();
}

function navegarCalendarioRotina(delta) {
  mesCalendarioRotina = new Date(mesCalendarioRotina.getFullYear(), mesCalendarioRotina.getMonth() + delta, 1);
  renderizarRotinaMensal();
}

function alternarExcecaoRotina(dataISO) {
  if (!rotinaConfigurada() || !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return;
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const trabalhaAgora = diaEhTrabalho(data);
  const trabalhaBase = diaEhTrabalhoBase(data);
  const deveTrabalhar = !trabalhaAgora;
  config.diasFolgaExtra = config.diasFolgaExtra.filter(item => item !== dataISO);
  config.diasTrabalhoExtra = config.diasTrabalhoExtra.filter(item => item !== dataISO);
  if (deveTrabalhar !== trabalhaBase) {
    if (deveTrabalhar) config.diasTrabalhoExtra.push(dataISO);
    else config.diasFolgaExtra.push(dataISO);
  }
  atualizarDiasPlanejadosDaRotina();
  renderizarRotinaMensal();
  render();
}

function renderizarRotinaMensal() {
  const titulo = document.getElementById("calendarioRotinaTitulo");
  const grade = document.getElementById("calendarioRotina");
  const resumo = document.getElementById("rotinaDiasResumo");
  const blocoManual = document.getElementById("blocoDiasManual");
  if (!titulo || !grade || !resumo || !blocoManual) return;

  const ano = mesCalendarioRotina.getFullYear();
  const mes = mesCalendarioRotina.getMonth() + 1;
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const total = calcularDiasPlanejadosDoMes(ano, mes, config);
  const rotinaAtiva = rotinaConfigurada();
  titulo.innerText = `${meses[mes - 1]} de ${ano}`;
  resumo.innerText = rotinaAtiva ? `${total} dias planejados` : `${Number(config.diasPlanejados) || 0} dias planejados`;
  blocoManual.classList.toggle("hidden", rotinaAtiva);

  document.querySelectorAll("[data-weekday]").forEach(botao => {
    botao.classList.toggle("ativo", config.diasSemana.includes(Number(botao.dataset.weekday)));
  });

  const primeiroDia = new Date(ano, mes - 1, 1);
  const deslocamento = primeiroDia.getDay();
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const feriados = feriadosNacionais(ano);
  const vazios = Array.from({ length: deslocamento }, () => '<span class="calendario-dia vazio"></span>');
  const dias = Array.from({ length: ultimoDia }, (_, indice) => {
    const dia = indice + 1;
    const data = new Date(ano, mes - 1, dia);
    const dataISO = dataISOCalendario(ano, mes, dia);
    const feriado = feriados.has(dataISO);
    const excecao = config.diasFolgaExtra.includes(dataISO) || config.diasTrabalhoExtra.includes(dataISO);
    const trabalha = diaEhTrabalho(data);
    const classes = ["calendario-dia", trabalha ? "trabalho" : "folga"];
    if (feriado) classes.push("feriado");
    if (excecao) classes.push("excecao");
    if (!rotinaAtiva) classes.push("desabilitado");
    const estado = trabalha ? "Trabalho" : (feriado ? "Feriado" : "Folga");
    return `<button type="button" class="${classes.join(" ")}" data-calendar-date="${dataISO}" ${rotinaAtiva ? "" : "disabled"} aria-label="${dia} de ${meses[mes - 1]}: ${estado}"><strong>${dia}</strong><small>${excecao ? "Exceção" : estado}</small></button>`;
  });
  grade.innerHTML = [...vazios, ...dias].join("");
}

function mediaGanhoDoMesAtual() {
  const mesAtual = mesKeyDeData(new Date());
  const ganhosPorDia = {};
  dados.forEach(item => {
    if (obterMesKey(item.data) !== mesAtual || item.descricao !== "Ganhos Uber" || Number(item.valor) <= 0) return;
    ganhosPorDia[item.data] = (ganhosPorDia[item.data] || 0) + Number(item.valor);
  });
  const valores = Object.values(ganhosPorDia);
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : 0;
}

function garantirSimulacao() {
  if (simulacao) return;
  const hoje = new Date();
  const totais = totaisMetasConfig(config);
  simulacao = {
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
    diasSemana: [...(config.diasSemana || [])],
    trabalhoEmFeriados: !!config.trabalhoEmFeriados,
    diasFolgaExtra: [...(config.diasFolgaExtra || [])],
    diasTrabalhoExtra: [...(config.diasTrabalhoExtra || [])],
    mediaDia: mediaGanhoDoMesAtual(),
    custos: totais.sobrevivencia,
    retirada: Math.max(totais.estabilidade - totais.sobrevivencia, 0),
    conforto: Math.max(totais.conforto - totais.estabilidade, 0)
  };

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  simMes.innerHTML = meses.map((nome, indice) => `<option value="${indice + 1}">${nome}</option>`).join("");
  simAno.innerHTML = Array.from({ length: 7 }, (_, indice) => hoje.getFullYear() - 1 + indice)
    .map(ano => `<option value="${ano}">${ano}</option>`).join("");
  simMes.value = String(simulacao.mes);
  simAno.value = String(simulacao.ano);
  simMediaDia.value = simulacao.mediaDia ? moeda(simulacao.mediaDia) : "";
  simCustos.value = simulacao.custos ? moeda(simulacao.custos) : "";
  simRetirada.value = simulacao.retirada ? moeda(simulacao.retirada) : "";
  simConforto.value = simulacao.conforto ? moeda(simulacao.conforto) : "";
  simTrabalhoEmFeriados.checked = simulacao.trabalhoEmFeriados;
}

function configDaSimulacao() {
  garantirSimulacao();
  return {
    ...config,
    diasPlanejados: 0,
    diasSemana: simulacao.diasSemana,
    trabalhoEmFeriados: simulacao.trabalhoEmFeriados,
    diasFolgaExtra: simulacao.diasFolgaExtra,
    diasTrabalhoExtra: simulacao.diasTrabalhoExtra
  };
}

function atualizarPeriodoSimulacao() {
  garantirSimulacao();
  simulacao.mes = Number(simMes.value) || simulacao.mes;
  simulacao.ano = Number(simAno.value) || simulacao.ano;
  renderizarSimulacao();
}

function atualizarValoresSimulacao() {
  garantirSimulacao();
  simulacao.mediaDia = parseMoeda(simMediaDia.value);
  simulacao.custos = parseMoeda(simCustos.value);
  simulacao.retirada = parseMoeda(simRetirada.value);
  simulacao.conforto = parseMoeda(simConforto.value);
}

function alternarDiaSemanaSimulacao(dia) {
  garantirSimulacao();
  const dias = new Set(simulacao.diasSemana);
  if (dias.has(dia)) dias.delete(dia);
  else dias.add(dia);
  simulacao.diasSemana = [...dias].sort((a, b) => a - b);
  renderizarSimulacao();
}

function alternarExcecaoSimulacao(dataISO) {
  garantirSimulacao();
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const configSim = configDaSimulacao();
  const trabalhaAgora = diaEhTrabalho(data, configSim);
  const trabalhaBase = diaEhTrabalhoBase(data, configSim);
  const deveTrabalhar = !trabalhaAgora;
  simulacao.diasFolgaExtra = simulacao.diasFolgaExtra.filter(item => item !== dataISO);
  simulacao.diasTrabalhoExtra = simulacao.diasTrabalhoExtra.filter(item => item !== dataISO);
  if (deveTrabalhar !== trabalhaBase) {
    if (deveTrabalhar) simulacao.diasTrabalhoExtra.push(dataISO);
    else simulacao.diasFolgaExtra.push(dataISO);
  }
  renderizarSimulacao();
}

function ganhosReaisDoMes(ano, mes) {
  const mesKey = `${ano}-${String(mes).padStart(2, "0")}`;
  return dados.reduce((soma, item) => (
    obterMesKey(item.data) === mesKey && item.descricao === "Ganhos Uber" && Number(item.valor) > 0
      ? soma + Number(item.valor)
      : soma
  ), 0);
}

function diasPlanejadosRestantes(ano, mes, configBase) {
  const hoje = new Date();
  const primeiroDia = ano === hoje.getFullYear() && mes === hoje.getMonth() + 1 ? hoje.getDate() : 1;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  let total = 0;
  for (let dia = primeiroDia; dia <= ultimoDia; dia++) {
    if (diaEhTrabalho(new Date(ano, mes - 1, dia), configBase)) total++;
  }
  return total;
}

function atualizarMetaSimulada(idMeta, idNecessario, meta, faturamentoProjetado, faturamentoBase, diasBase, texto) {
  const elementoMeta = document.getElementById(idMeta);
  const elementoNecessario = document.getElementById(idNecessario);
  if (elementoMeta) elementoMeta.innerText = moeda(meta);
  const faltaProjetada = Math.max(meta - faturamentoProjetado, 0);
  const faltaReal = Math.max(meta - faturamentoBase, 0);
  const porDia = diasBase > 0 ? faltaReal / diasBase : 0;
  if (elementoNecessario) {
    elementoNecessario.innerText = faltaProjetada <= 0
      ? "Meta atingida nesta projeção"
      : `${moeda(porDia)}/dia para ${texto}`;
  }
}

function renderizarSimulacao() {
  garantirSimulacao();
  atualizarValoresSimulacao();
  const configSim = configDaSimulacao();
  const diasPlanejados = calcularDiasPlanejadosDoMes(simulacao.ano, simulacao.mes, configSim);
  const hoje = new Date();
  const mesAtual = simulacao.ano === hoje.getFullYear() && simulacao.mes === hoje.getMonth() + 1;
  const faturamentoAtual = mesAtual ? ganhosReaisDoMes(simulacao.ano, simulacao.mes) : 0;
  const diasParaPrevisao = mesAtual ? diasPlanejadosRestantes(simulacao.ano, simulacao.mes, configSim) : diasPlanejados;
  const faturamentoProjetado = faturamentoAtual + (simulacao.mediaDia * diasParaPrevisao);
  const sobrevivencia = simulacao.custos;
  const estabilidade = sobrevivencia + simulacao.retirada;
  const conforto = estabilidade + simulacao.conforto;
  const metaAtingida = conforto > 0 && faturamentoProjetado >= conforto ? "Conforto"
    : estabilidade > 0 && faturamentoProjetado >= estabilidade ? "Estabilidade"
      : sobrevivencia > 0 && faturamentoProjetado >= sobrevivencia ? "Sobrevivência" : "Nenhuma";

  simDiasPlanejados.innerText = String(diasPlanejados);
  simRotinaResumo.innerText = `${diasPlanejados} dias planejados`;
  simFaturamentoProjetado.innerText = moeda(faturamentoProjetado);
  simMetaAtingida.innerText = metaAtingida;
  simFaturamentoSub.innerText = mesAtual
    ? `${moeda(faturamentoAtual)} já registrado + ${moeda(simulacao.mediaDia)} por ${diasParaPrevisao} dia(s) restante(s)`
    : `${moeda(simulacao.mediaDia)} por ${diasPlanejados} dia(s) planejado(s)`;
  atualizarMetaSimulada("simMetaSobrevivencia", "simNecessarioSobrevivencia", sobrevivencia, faturamentoProjetado, faturamentoAtual, diasParaPrevisao, "cobrir os custos");
  atualizarMetaSimulada("simMetaEstabilidade", "simNecessarioEstabilidade", estabilidade, faturamentoProjetado, faturamentoAtual, diasParaPrevisao, "chegar à estabilidade");
  atualizarMetaSimulada("simMetaConforto", "simNecessarioConforto", conforto, faturamentoProjetado, faturamentoAtual, diasParaPrevisao, "chegar ao conforto");

  document.querySelectorAll("[data-sim-weekday]").forEach(botao => {
    botao.classList.toggle("ativo", simulacao.diasSemana.includes(Number(botao.dataset.simWeekday)));
  });
  simTrabalhoEmFeriados.checked = simulacao.trabalhoEmFeriados;
  const primeiroDia = new Date(simulacao.ano, simulacao.mes - 1, 1);
  const deslocamento = primeiroDia.getDay();
  const ultimoDia = new Date(simulacao.ano, simulacao.mes, 0).getDate();
  const feriados = feriadosNacionais(simulacao.ano);
  const vazios = Array.from({ length: deslocamento }, () => '<span class="calendario-dia vazio"></span>');
  const dias = Array.from({ length: ultimoDia }, (_, indice) => {
    const dia = indice + 1;
    const data = new Date(simulacao.ano, simulacao.mes - 1, dia);
    const dataISO = dataISOCalendario(simulacao.ano, simulacao.mes, dia);
    const trabalha = diaEhTrabalho(data, configSim);
    const excecao = simulacao.diasFolgaExtra.includes(dataISO) || simulacao.diasTrabalhoExtra.includes(dataISO);
    const classes = ["calendario-dia", trabalha ? "trabalho" : "folga"];
    if (feriados.has(dataISO)) classes.push("feriado");
    if (excecao) classes.push("excecao");
    return `<button type="button" class="${classes.join(" ")}" data-sim-date="${dataISO}"><strong>${dia}</strong><small>${excecao ? "Exceção" : (trabalha ? "Trabalho" : (feriados.has(dataISO) ? "Feriado" : "Folga"))}</small></button>`;
  });
  simCalendario.innerHTML = [...vazios, ...dias].join("");
}

function formatarData(dataISO) {
  if (!dataISO) return "-";
  const partes = dataISO.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataLonga(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split("-").map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return "";

  const dataObj = new Date(partes[0], partes[1] - 1, partes[2]);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${dataObj.getDate()} de ${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;
}

function atualizarDataPorExtenso() {
  const el = document.getElementById("dataPorExtenso");
  if (!el) return;
  el.innerText = formatarDataLonga(data.value);
}

function definirDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  data.value = `${ano}-${mes}-${dia}`;
  atualizarDataPorExtenso();
}

function preencherCamposConfig() {
  if (document.getElementById("saldoInicial")) saldoInicial.value = "0";
  diasPlanejados.value = config.diasPlanejados || "";
  if (document.getElementById("tipoVeiculo")) tipoVeiculo.value = tipoVeiculoSeguro(config.tipoVeiculo);
  if (document.getElementById("retiradaDesejada")) retiradaDesejada.value = config.retiradaDesejada ? moeda(config.retiradaDesejada) : "";
  if (document.getElementById("confortoDesejado")) confortoDesejado.value = config.confortoDesejado ? moeda(config.confortoDesejado) : "";
  if (document.getElementById("trabalhoEmFeriados")) trabalhoEmFeriados.checked = !!config.trabalhoEmFeriados;
  renderizarRotinaMensal();
  atualizarRotulosVeiculo();
  renderizarMetasConfig();
}

function salvarBackupLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(HISTORICO_KEY, JSON.stringify(fechamentos));
}

function carregarBackupLocal() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  const configSalva = localStorage.getItem(CONFIG_KEY);
  const fechamentosSalvos = localStorage.getItem(HISTORICO_KEY);
  let dadosLocais = [];
  let configLocal = { ...config };
  let fechamentosLocais = {};

  if (salvo) {
    try { dadosLocais = JSON.parse(salvo) || []; } catch { dadosLocais = []; }
  }

  if (configSalva) {
    try { configLocal = { ...configLocal, ...JSON.parse(configSalva) }; } catch {}
  }

  if (fechamentosSalvos) {
    try { fechamentosLocais = JSON.parse(fechamentosSalvos) || {}; } catch { fechamentosLocais = {}; }
  }

  return { dadosLocais, configLocal, fechamentosLocais };
}

async function salvarEstado() {
  salvarBackupLocal();
  setStatusSync("Salvando...", "salvando");

  if (!firebaseCarregado) {
    setStatusSync("Backup local salvo", "salvando");
    return;
  }

  salvandoFirebase = true;
  try {
    await estadoRef.set({
      config,
      dados,
      fechamentos,
      atualizadoEm: new Date().toISOString()
    });
    setStatusSync("Sincronizado", "ok");
  } catch (erro) {
    console.error("Erro ao salvar no Firebase:", erro);
    setStatusSync("Falha ao sincronizar", "erro");
    alert("Não consegui salvar na nuvem. Os dados ficaram salvos neste navegador.");
  } finally {
    salvandoFirebase = false;
  }
}

function iniciarSincronizacaoFirebase() {
  const { dadosLocais, configLocal, fechamentosLocais } = carregarBackupLocal();

  estadoRef.onSnapshot(async (snapshot) => {
    firebaseCarregado = true;

    if (!snapshot.exists) {
      dados = dadosLocais;
      normalizarDados();
      config = { ...config, ...configLocal };
      normalizarConfigAtual();
      fechamentos = { ...fechamentos, ...fechamentosLocais };
      executarManutencaoMensal(false);
      preencherCamposConfig();
      render();

      if (!bloqueiaRestauracaoLocal && (dados.length > 0 || Object.values(config).some(v => Number(v) > 0))) {
        await salvarEstado();
      }
      return;
    }

    const estado = snapshot.data() || {};
    const dadosFirebase = Array.isArray(estado.dados) ? estado.dados : [];
    const configFirebase = estado.config || {};
    const fechamentosFirebase = estado.fechamentos || {};
    const foiResetado = !!estado.resetadoEm;

    // Primeira migração: se a nuvem estiver vazia e existir backup local,
    // restaura apenas quando o estado NÃO veio de uma limpeza intencional.
    if (!bloqueiaRestauracaoLocal && !foiResetado && dadosFirebase.length === 0 && dadosLocais.length > 0) {
      dados = dadosLocais;
      normalizarDados();
      config = { ...config, ...configLocal };
      normalizarConfigAtual();
      fechamentos = { ...fechamentos, ...fechamentosLocais };
      executarManutencaoMensal(false);
      preencherCamposConfig();
      render();
      await salvarEstado();
      return;
    }

    dados = dadosFirebase;
    normalizarDados();
    config = { ...config, ...configFirebase };
    normalizarConfigAtual();
    fechamentos = { ...fechamentos, ...fechamentosFirebase };

    const houveManutencao = executarManutencaoMensal(false);
    salvarBackupLocal();
    preencherCamposConfig();
    render();
    setStatusSync("Sincronizado", "ok");

    if (houveManutencao && !salvandoFirebase) {
      await salvarEstado();
    }
  }, (erro) => {
    console.error("Erro ao carregar Firebase:", erro);
    const backup = carregarBackupLocal();
    dados = backup.dadosLocais;
    normalizarDados();
    config = { ...config, ...backup.configLocal };
    normalizarConfigAtual();
    fechamentos = { ...fechamentos, ...backup.fechamentosLocais };
    preencherCamposConfig();
    render();
    setStatusSync("Usando backup local", "erro");
    alert("Não consegui carregar a nuvem. Usei o backup deste navegador.");
  });
}

function exportarJSON() {
  const pacote = {
    config,
    dados,
    fechamentos
  };

  const conteudo = JSON.stringify(pacote, null, 2);
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "controle-uber.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importarJSON(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = async function(e) {
    try {
      const importado = JSON.parse(e.target.result);

      if (Array.isArray(importado)) {
        dados = importado;
        normalizarDados();
      } else if (importado.dados && Array.isArray(importado.dados)) {
        dados = importado.dados;
        normalizarDados();
        if (importado.config) config = { ...config, ...importado.config };
        if (importado.fechamentos) fechamentos = { ...fechamentos, ...importado.fechamentos };
        if (importado.saldoInicial !== undefined) config.saldoInicial = 0;
        normalizarConfigAtual();
      } else {
        return alert("Arquivo inválido");
      }

      executarManutencaoMensal(false);
      preencherCamposConfig();
      render();
      await salvarEstado();

      event.target.value = "";
      alert("Dados importados com sucesso");
    } catch {
      alert("Erro ao importar arquivo");
    }
  };

  leitor.readAsText(arquivo);
}

async function limparDados() {
  if (!confirm("Vai apagar TUDO da nuvem e deste navegador. Continuar?")) return;

  bloqueiaRestauracaoLocal = true;

  dados = [];
  config = {
    saldoInicial: 0,
    metaGasolina: 0,
    metaSeguro: 0,
    metaCustosGerais: 0,
    metaParcela: 0,
    diasPlanejados: 0,
    metaConsistente: 0,
    tipoVeiculo: "combustao",
    retiradaDesejada: 0,
    retiradaObjetivo: "estabilidade",
    confortoDesejado: 0,
    diasSemana: [],
    trabalhoEmFeriados: false,
    diasFolgaExtra: [],
    diasTrabalhoExtra: [],
    modeloMetasVersao: 2,
    revisaoMesPendente: "",
    metas: []
  };
  fechamentos = {};

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(HISTORICO_KEY);

  preencherCamposConfig();
  render();

  try {
    await estadoRef.set({
      config,
      dados: [],
      fechamentos: {},
      atualizadoEm: new Date().toISOString(),
      resetadoEm: new Date().toISOString()
    });

    alert("Tudo apagado com sucesso.");
  } catch (erro) {
    console.error("Erro ao limpar Firebase:", erro);
    alert("Não consegui apagar na nuvem. Tente novamente.");
  } finally {
    bloqueiaRestauracaoLocal = false;
  }
}


function atualizarCabecalho() {
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const agora = new Date();
  const texto = `${meses[agora.getMonth()]} de ${agora.getFullYear()}`;
  const el = document.getElementById("mesAtualTexto");
  if (el) el.innerText = texto.charAt(0).toUpperCase() + texto.slice(1);
}

function setStatusSync(texto, modo = "ok") {
  const el = document.getElementById("statusSync");
  const dot = document.querySelector(".status-dot");
  const pill = document.querySelector(".status-pill");
  if (!el || !dot || !pill) return;
  el.innerText = texto;
  if (modo === "erro") {
    dot.style.background = "#ef4444";
    pill.style.color = "#991b1b";
    pill.style.borderColor = "#fecaca";
  } else if (modo === "salvando") {
    dot.style.background = "#f59e0b";
    pill.style.color = "#92400e";
    pill.style.borderColor = "#fed7aa";
  } else {
    dot.style.background = "#22c55e";
    pill.style.color = "#166534";
    pill.style.borderColor = "#bbf7d0";
  }
}

atualizarCabecalho();
definirDataHoje();
selecionar("ganho");
render();
iniciarSincronizacaoFirebase();
