const state = {
  fornecedores: [],
  promotores: [],
  movimentos: [],
  dashboard: null,
  cumprimento: null
};

const el = (id) => document.getElementById(id);

function log(message, data) {
  const panel = el("log");
  const line = `[${new Date().toISOString()}] ${message}`;
  const payload = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  panel.textContent = `${line}${payload}\n\n${panel.textContent}`;
}

function authHeader(username, password) {
  return "Basic " + btoa(`${username}:${password}`);
}

function baseHeaders(username, password) {
  return {
    "Authorization": authHeader(username, password),
    "Content-Type": "application/json",
    "X-Correlation-Id": crypto.randomUUID()
  };
}

function getBaseUrl() {
  return el("baseUrl").value.trim();
}

function getUserAuth() {
  return {
    username: el("username").value.trim(),
    password: el("password").value
  };
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      panels.forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      const panel = document.getElementById(tab.dataset.tab);
      if (panel) panel.classList.add("is-active");
    });
  });
}

function initDashboardDefaults() {
  if (!el("dashData").value) {
    el("dashData").value = new Date().toISOString().slice(0, 10);
  }
  if (!el("cumprimentoData").value) {
    el("cumprimentoData").value = new Date().toISOString().slice(0, 10);
  }
}

async function apiRequest(path, method = "GET", body = null, auth = null) {
  const creds = auth || getUserAuth();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: baseHeaders(creds.username, creds.password),
    body: body ? JSON.stringify(body) : null
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!response.ok) {
    log(`${method} ${path} -> ${response.status}`, data);
    throw new Error(`${response.status} ${response.statusText}`);
  }
  log(`${method} ${path} -> ${response.status}`, data);
  return data;
}

function renderPromotores(list) {
  const tbody = el("tblPromotores").querySelector("tbody");
  tbody.innerHTML = "";
  list.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nome ?? ""}</td>
      <td>${p.fornecedorNome ?? ""}</td>
      <td>${p.status ?? ""}</td>
      <td>${p.telefone ?? ""}</td>`;
    tbody.appendChild(tr);
  });
}

function renderMovimentos(list) {
  const tbody = el("tblMovimentos").querySelector("tbody");
  tbody.innerHTML = "";
  list.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.promotorId ?? ""}</td>
      <td>${m.tipo ?? ""}</td>
      <td>${m.dataHora ?? ""}</td>
      <td>${m.responsavel ?? ""}</td>
      <td>${m.liberadoPor ?? ""}</td>
      <td>${m.observacao ?? ""}</td>`;
    tbody.appendChild(tr);
  });
}

function renderDashboard(resumo) {
  el("dashCardEmLoja").value = resumo.emLojaAgora ?? 0;
  el("dashCardEntradas").value = resumo.entradasHoje ?? 0;
  el("dashCardSaidas").value = resumo.saidasHoje ?? 0;
  el("dashCardAjustes").value = resumo.ajustesHoje ?? 0;

  const tbody = el("tblDashboardPrincipal").querySelector("tbody");
  tbody.innerHTML = "";
  (resumo.linhas ?? []).forEach((linha) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.promotorNome ?? ""}</td>
      <td>${linha.fornecedorNome ?? ""}</td>
      <td>${linha.entradaEm ?? ""}</td>
      <td>${linha.usuarioEntrada ?? ""}</td>
      <td>${linha.saiu ? "SIM" : "NAO"}</td>
      <td>${linha.saidaEm ?? ""}</td>
      <td>${linha.usuarioSaida ?? ""}</td>
      <td>${linha.liberadoPor ?? ""}</td>`;
    tr.style.backgroundColor = linha.saiu ? "#f3f4f6" : "#dcfce7";
    tbody.appendChild(tr);
  });
}

function renderCumprimento(resumo) {
  const tbody = el("tblCumprimento").querySelector("tbody");
  tbody.innerHTML = "";
  (resumo.itens ?? []).forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.fornecedorNome ?? ""}</td>
      <td>${item.entradasPrevistas ?? 0}</td>
      <td>${item.entradasRealizadas ?? 0}</td>
      <td>${item.percentualCumprimento ?? 0}%</td>
      <td>${item.desvioPercentual ?? 0}%</td>
      <td>${item.alerta ? "SIM" : "NAO"}</td>`;
    tr.style.backgroundColor = item.alerta ? "#fee2e2" : "#ecfeff";
    tbody.appendChild(tr);
  });
}

function syncPromotorSelect() {
  const select = el("movPromotor");
  select.innerHTML = "";
  state.promotores.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nome} (${p.id.slice(0, 8)}...)`;
    select.appendChild(opt);
  });
}

function syncFornecedorSelect() {
  const select = el("pFornecedorId");
  const dashSelect = el("dashFornecedorId");
  select.innerHTML = "";
  dashSelect.innerHTML = "<option value=\"\">Todos</option>";
  state.fornecedores.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.nome;
    select.appendChild(opt);

    const optDash = document.createElement("option");
    optDash.value = f.id;
    optDash.textContent = f.nome;
    dashSelect.appendChild(optDash);
  });
}

function buildDashboardQuery() {
  const params = new URLSearchParams();
  const data = el("dashData").value;
  const fornecedorId = el("dashFornecedorId").value;
  const status = el("dashStatus").value;
  if (data) params.set("data", data);
  if (fornecedorId) params.set("fornecedorId", fornecedorId);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/dashboard/planilha-principal?${query}` : "/dashboard/planilha-principal";
}

function buildCumprimentoQuery() {
  const params = new URLSearchParams();
  const data = el("cumprimentoData").value;
  const percentualMinimo = el("cumprimentoMinimo").value;
  if (data) params.set("data", data);
  if (percentualMinimo) params.set("percentualMinimo", percentualMinimo);
  const query = params.toString();
  return query
    ? `/dashboard/cumprimento-fornecedores?${query}`
    : "/dashboard/cumprimento-fornecedores";
}

async function refreshDashboard() {
  state.dashboard = await apiRequest(buildDashboardQuery());
  renderDashboard(state.dashboard);
}

async function refreshCumprimento() {
  state.cumprimento = await apiRequest(buildCumprimentoQuery());
  renderCumprimento(state.cumprimento);
}

async function refreshData() {
  state.fornecedores = await apiRequest("/fornecedores");
  state.promotores = await apiRequest("/promotores");
  state.movimentos = await apiRequest("/movimentos");
  renderPromotores(state.promotores);
  renderMovimentos(state.movimentos);
  syncFornecedorSelect();
  syncPromotorSelect();
  await refreshDashboard();
  await refreshCumprimento();
}

async function criarFornecedor() {
  const payload = {
    nome: el("fNome").value.trim(),
    ativo: el("fAtivo").value === "true"
  };
  await apiRequest("/fornecedores", "POST", payload);
  await refreshData();
}

async function criarPromotor() {
  const payload = {
    nome: el("pNome").value.trim(),
    telefone: el("pTelefone").value.trim(),
    fornecedorId: Number(el("pFornecedorId").value),
    status: el("pStatus").value,
    fotoPath: ""
  };
  await apiRequest("/promotores", "POST", payload);
  await refreshData();
}

async function registrarMovimento(tipo) {
  const path = tipo === "ENTRADA" ? "/movimentos/entrada" : "/movimentos/saida";
  const payload = {
    promotorId: el("movPromotor").value,
    responsavel: el("movResponsavel").value.trim(),
    liberadoPor: tipo === "SAIDA" ? el("movLiberadoPor").value.trim() : null,
    observacao: el("movObservacao").value.trim()
  };
  await apiRequest(path, "POST", payload);
  await refreshData();
}

async function ajustarHorario() {
  const admin = {
    username: el("adminUsername").value.trim(),
    password: el("adminPassword").value
  };
  const movId = el("ajusteMovId").value.trim();
  const payload = {
    novaDataHora: el("ajusteDataHora").value.replace(" ", "T"),
    motivo: el("ajusteMotivo").value.trim()
  };
  await apiRequest(`/movimentos/${movId}/ajuste-horario`, "PATCH", payload, admin);
  await refreshData();
}

function bindActions() {
  el("btnRefresh").addEventListener("click", () => refreshData().catch((e) => log("Falha ao atualizar", { error: e.message })));
  el("btnRefreshDashboard").addEventListener("click", () => refreshDashboard().catch((e) => log("Falha dashboard", { error: e.message })));
  el("btnRefreshCumprimento").addEventListener("click", () => refreshCumprimento().catch((e) => log("Falha cumprimento", { error: e.message })));
  el("btnCriarFornecedor").addEventListener("click", () => criarFornecedor().catch((e) => log("Falha ao criar fornecedor", { error: e.message })));
  el("btnCriarPromotor").addEventListener("click", () => criarPromotor().catch((e) => log("Falha ao criar", { error: e.message })));
  el("btnEntrada").addEventListener("click", () => registrarMovimento("ENTRADA").catch((e) => log("Falha entrada", { error: e.message })));
  el("btnSaida").addEventListener("click", () => registrarMovimento("SAIDA").catch((e) => log("Falha saida", { error: e.message })));
  el("btnAjustar").addEventListener("click", () => ajustarHorario().catch((e) => log("Falha ajuste", { error: e.message })));

  el("btnFiltroPromotor").addEventListener("click", () => {
    const fornecedor = el("filtroFornecedorPromotor").value.trim().toLowerCase();
    if (!fornecedor) return renderPromotores(state.promotores);
    renderPromotores(state.promotores.filter((p) => (p.fornecedorNome ?? "").toLowerCase().includes(fornecedor)));
  });

  el("btnFiltroMov").addEventListener("click", () => {
    const promotorId = el("filtroPromotorMov").value.trim();
    if (!promotorId) return renderMovimentos(state.movimentos);
    renderMovimentos(state.movimentos.filter((m) => String(m.promotorId) === promotorId));
  });
}

bindActions();
setupTabs();
initDashboardDefaults();
refreshData().catch((e) => log("Falha inicial. Confira base URL e credenciais.", { error: e.message }));
