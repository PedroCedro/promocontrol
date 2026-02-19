const state = {
  fornecedores: [],
  promotores: [],
  movimentos: [],
  dashboard: null,
  cumprimento: null,
  auth: null,
  pendingAuth: null
};

const el = (id) => document.getElementById(id);

function log(message, data) {
  const panel = el("log");
  if (!panel) return;
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

function showLoginView() {
  el("loginView").classList.remove("is-hidden");
  el("appShell").classList.add("is-hidden");
}

function showAppView() {
  el("loginView").classList.add("is-hidden");
  el("appShell").classList.remove("is-hidden");
}

function showForceChangeBox() {
  el("forceChangeBox").classList.remove("is-hidden");
}

function hideForceChangeBox() {
  el("forceChangeBox").classList.add("is-hidden");
  el("newPassword").value = "";
  el("confirmPassword").value = "";
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

function loadSavedLogin() {
  const savedUsername = localStorage.getItem("pc_username");
  if (savedUsername) el("loginUsername").value = savedUsername;
}

function setLoginMessage(message) {
  el("loginMessage").textContent = message || "";
}

function saveLogin(username) {
  localStorage.setItem("pc_username", username);
}

function applySessionToUI() {
  el("baseUrl").value = state.auth.baseUrl;
  el("currentUser").value = state.auth.username;
  el("currentRole").value = state.auth.role;
  el("adminAjusteCard").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("adminResetCard").classList.toggle("is-hidden", !state.auth.isAdmin);
}

async function rawRequest(path, method, auth, body = null) {
  const response = await fetch(`${auth.baseUrl}${path}`, {
    method,
    headers: baseHeaders(auth.username, auth.password),
    body: body ? JSON.stringify(body) : null
  });

  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { response, data };
}

async function apiRequest(path, method = "GET", body = null, auth = null) {
  const creds = auth || state.auth;
  if (!creds) {
    throw new Error("Sessao nao autenticada");
  }

  const { response, data } = await rawRequest(path, method, creds, body);

  if (!response.ok) {
    log(`${method} ${path} -> ${response.status}`, data);
    throw new Error(`${response.status} ${response.statusText}`);
  }

  log(`${method} ${path} -> ${response.status}`, data);
  return data;
}

async function loadSession(auth) {
  const sessionData = await apiRequest("/auth/sessao", "GET", null, auth);
  return {
    username: sessionData.username,
    role: sessionData.perfil,
    isAdmin: sessionData.perfil === "ADMIN",
    mustChangePassword: sessionData.precisaTrocarSenha
  };
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
  if (!state.auth?.isAdmin) {
    throw new Error("Apenas ADMIN pode ajustar horario");
  }

  const movId = el("ajusteMovId").value.trim();
  const novaDataHora = el("ajusteDataHora").value;
  const motivo = el("ajusteMotivo").value.trim();
  if (!movId || !novaDataHora || !motivo) {
    throw new Error("Informe movimento, nova data/hora e motivo");
  }

  const payload = { novaDataHora, motivo };
  await apiRequest(`/movimentos/${movId}/ajuste-horario`, "PATCH", payload);
  await refreshData();
}

async function login() {
  const baseUrl = window.location.origin;
  const username = el("loginUsername").value.trim();
  const password = el("loginPassword").value;
  if (!username || !password) {
    throw new Error("Preencha usuario e senha");
  }

  const session = { baseUrl, username, password, role: "", isAdmin: false };
  setLoginMessage("");
  const sessionInfo = await loadSession(session);

  if (sessionInfo.mustChangePassword) {
    state.pendingAuth = { ...session, ...sessionInfo };
    showForceChangeBox();
    setLoginMessage("Senha temporaria detectada. Troque a senha para continuar.");
    return;
  }

  await completeLogin({ ...session, ...sessionInfo });
}

async function completeLogin(fullSession) {
  state.pendingAuth = null;
  state.auth = fullSession;
  saveLogin(fullSession.username);
  hideForceChangeBox();
  applySessionToUI();
  showAppView();
  await refreshData();
  log("Login efetuado", { usuario: fullSession.username, perfil: fullSession.role });
}

async function alterarSenhaObrigatoria() {
  if (!state.pendingAuth) {
    throw new Error("Nao existe sessao pendente para troca de senha");
  }

  const novaSenha = el("newPassword").value;
  const confirmarSenha = el("confirmPassword").value;
  if (!novaSenha || !confirmarSenha) {
    throw new Error("Informe e confirme a nova senha");
  }
  if (novaSenha !== confirmarSenha) {
    throw new Error("As senhas nao conferem");
  }
  if (novaSenha.length < 6) {
    throw new Error("A nova senha deve ter no minimo 6 caracteres");
  }

  await apiRequest("/auth/alterar-senha", "POST", { novaSenha }, state.pendingAuth);
  const nextAuth = { ...state.pendingAuth, password: novaSenha };
  const updatedSession = await loadSession(nextAuth);
  if (updatedSession.mustChangePassword) {
    throw new Error("Nao foi possivel concluir a troca obrigatoria de senha");
  }

  await completeLogin({ ...nextAuth, ...updatedSession });
}

async function resetarSenhaUsuario() {
  if (!state.auth?.isAdmin) {
    throw new Error("Apenas ADMIN pode resetar senha");
  }

  const username = el("resetUsername").value.trim();
  if (!username) {
    throw new Error("Informe o usuario para reset");
  }

  const response = await apiRequest("/auth/admin/resetar-senha", "POST", { username });
  el("resetTempPassword").value = response.senhaTemporaria ?? "";
  log("Senha resetada por admin", { username: response.username });
}

function logout() {
  state.auth = null;
  state.pendingAuth = null;
  showLoginView();
  hideForceChangeBox();
  el("currentUser").value = "";
  el("currentRole").value = "";
  el("baseUrl").value = "";
  el("loginPassword").value = "";
  el("resetTempPassword").value = "";
  setLoginMessage("");
}

function bindActions() {
  el("btnLogin").addEventListener("click", () => {
    login().catch((e) => {
      setLoginMessage(`Falha no login: ${e.message}`);
      log("Falha no login", { error: e.message });
    });
  });
  el("btnChangePassword").addEventListener("click", () => {
    alterarSenhaObrigatoria().catch((e) => {
      setLoginMessage(`Falha ao trocar senha: ${e.message}`);
      log("Falha troca obrigatoria de senha", { error: e.message });
    });
  });

  el("btnLogout").addEventListener("click", logout);
  el("btnRefresh").addEventListener("click", () => refreshData().catch((e) => log("Falha ao atualizar", { error: e.message })));
  el("btnRefreshDashboard").addEventListener("click", () => refreshDashboard().catch((e) => log("Falha dashboard", { error: e.message })));
  el("btnRefreshCumprimento").addEventListener("click", () => refreshCumprimento().catch((e) => log("Falha cumprimento", { error: e.message })));
  el("btnCriarFornecedor").addEventListener("click", () => criarFornecedor().catch((e) => log("Falha ao criar fornecedor", { error: e.message })));
  el("btnCriarPromotor").addEventListener("click", () => criarPromotor().catch((e) => log("Falha ao criar", { error: e.message })));
  el("btnEntrada").addEventListener("click", () => registrarMovimento("ENTRADA").catch((e) => log("Falha entrada", { error: e.message })));
  el("btnSaida").addEventListener("click", () => registrarMovimento("SAIDA").catch((e) => log("Falha saida", { error: e.message })));
  el("btnAjustar").addEventListener("click", () => ajustarHorario().catch((e) => log("Falha ajuste", { error: e.message })));
  el("btnResetSenha").addEventListener("click", () => resetarSenhaUsuario().catch((e) => log("Falha reset de senha", { error: e.message })));

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
loadSavedLogin();
showLoginView();

