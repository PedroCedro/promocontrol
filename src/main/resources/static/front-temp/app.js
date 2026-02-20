const state = {
  fornecedores: [],
  promotores: [],
  usuarios: [],
  dashboard: null,
  dashboardMovimentosMap: new Map(),
  auth: null,
  pendingAuth: null,
  profile: {
    fullName: "",
    email: "",
    phone: "",
    avatarDataUrl: ""
  },
  cadastroFornecedorLookup: new Map(),
  movimentoPromotorLookup: new Map(),
  saidaModalContext: null,
  autoSyncIntervalId: null,
  autoSyncSignature: null,
  autoSyncRunning: false
};

const AUTO_SYNC_INTERVAL_MS = 8000;

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

function buildCorrelationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const now = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2);
  return `cid-${now}-${random}`;
}

function baseHeaders(username, password) {
  return {
    "Authorization": authHeader(username, password),
    "Content-Type": "application/json",
    "X-Correlation-Id": buildCorrelationId()
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
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.tab);
    });
  });
}

function activateTab(tabId) {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach((t) => t.classList.remove("is-active"));
  panels.forEach((p) => p.classList.remove("is-active"));

  const targetButton = Array.from(tabs).find((t) => t.dataset.tab === tabId);
  if (targetButton) {
    targetButton.classList.add("is-active");
  }

  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add("is-active");
}

function initDashboardDefaults() {
  if (!el("dashData").value) {
    el("dashData").value = new Date().toISOString().slice(0, 10);
  }
}

function loadSavedLogin() {
  loadProfileSettings();
}

function setLoginMessage(message) {
  el("loginMessage").textContent = message || "";
}

function setMovimentoMessage(message) {
  const field = el("movMessage");
  if (!field) return;
  field.textContent = message || "";
}

function setFornecedorMessage(message) {
  const field = el("fMessage");
  if (!field) return;
  field.textContent = message || "";
}

function setPromotorMessage(message) {
  const field = el("pMessage");
  if (!field) return;
  field.textContent = message || "";
}

function saveLogin(username) {
  localStorage.setItem("pc_username", username);
}

function loadProfileSettings() {
  state.profile = {
    fullName: localStorage.getItem("pc_profile_full_name") || "",
    email: localStorage.getItem("pc_profile_email") || "",
    phone: localStorage.getItem("pc_profile_phone") || "",
    avatarDataUrl: localStorage.getItem("pc_profile_avatar") || ""
  };
  applyProfileToUI();
}

function saveProfileSettings() {
  localStorage.setItem("pc_profile_full_name", state.profile.fullName || "");
  localStorage.setItem("pc_profile_email", state.profile.email || "");
  localStorage.setItem("pc_profile_phone", state.profile.phone || "");
  localStorage.setItem("pc_profile_avatar", state.profile.avatarDataUrl || "");
}

function applySessionToUI() {
  el("baseUrl").value = state.auth.baseUrl;
  el("currentUser").value = state.auth.username;
  el("currentRole").value = state.auth.role;
  el("profileUserName").textContent = state.auth.username;
  el("profileRoleName").textContent = getRoleDisplayName(state.auth.role);
  updateProfileInitials(state.auth.username);
  applyProfileToUI();
  el("tabUsersBtn").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("tabIntegracaoBtn").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("adminUsersCard").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("adminResetCard").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("adminUsersListCard").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("btnOpenProfile").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("tab-perfil").classList.toggle("is-hidden", !state.auth.isAdmin);

  if (!state.auth.isAdmin && el("tab-perfil").classList.contains("is-active")) {
    activateTab("tab-dashboard");
  }
}

function updateProfileInitials(username) {
  const safe = (username || "U").trim();
  const initials = safe.length >= 2 ? safe.slice(0, 2).toUpperCase() : safe.toUpperCase();
  el("profileAvatarFallback").textContent = initials;
}

function bindProfileAvatar() {
  const input = el("profileAvatarInput");
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      state.profile.avatarDataUrl = String(reader.result || "");
      saveProfileSettings();
      applyProfileToUI();
    };
    reader.readAsDataURL(file);
  });
}

function applyProfileToUI() {
  if (el("profileFullName")) el("profileFullName").value = state.profile.fullName || "";
  if (el("profileEmail")) el("profileEmail").value = state.profile.email || "";
  if (el("profilePhone")) el("profilePhone").value = state.profile.phone || "";

  if (state.profile.avatarDataUrl) {
    el("profileAvatarPreview").src = state.profile.avatarDataUrl;
    el("profileAvatarPreview").classList.remove("is-hidden");
    el("profileAvatarFallback").classList.add("is-hidden");
  } else {
    el("profileAvatarPreview").src = "";
    el("profileAvatarPreview").classList.add("is-hidden");
    el("profileAvatarFallback").classList.remove("is-hidden");
  }
}

function saveProfileFromForm() {
  state.profile.fullName = el("profileFullName").value.trim();
  state.profile.email = el("profileEmail").value.trim();
  state.profile.phone = el("profilePhone").value.trim();
  saveProfileSettings();
  applyProfileToUI();
  log("Perfil salvo localmente", {
    fullName: state.profile.fullName,
    email: state.profile.email
  });
}

function removerFotoPerfil() {
  const confirmar = window.confirm("Deseja realmente remover a foto do perfil?");
  if (!confirmar) return;

  state.profile.avatarDataUrl = "";
  saveProfileSettings();
  applyProfileToUI();
  if (el("profileAvatarInput")) {
    el("profileAvatarInput").value = "";
  }
  log("Foto de perfil removida localmente.");
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

async function silentApiRequest(path, method = "GET", body = null, auth = null) {
  const creds = auth || state.auth;
  if (!creds) {
    throw new Error("Sessao nao autenticada");
  }

  const { response, data } = await rawRequest(path, method, creds, body);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
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
      <td>${formatCodigo(p.codigo)}</td>
      <td>${p.nome ?? ""}</td>
      <td>${formatCodigo(p.fornecedorCodigo)} - ${p.fornecedorNome ?? ""}</td>
      <td>${p.status ?? ""}</td>
      <td>${p.telefone ?? ""}</td>`;
    tbody.appendChild(tr);
  });
}

function renderFornecedores(list) {
  const table = el("tblFornecedores");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  list.filter((f) => !isFornecedorSistema(f?.nome)).forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatCodigo(f.codigo)}</td>
      <td>${f.nome ?? ""}</td>
      <td>${f.ativo ? "SIM" : "NAO"}</td>`;
    tbody.appendChild(tr);
  });
}

function renderUsuarios(list) {
  const table = el("tblUsuarios");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  list.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.username ?? ""}</td>
      <td>${u.perfil ?? ""}</td>
      <td>${u.precisaTrocarSenha ? "SIM" : "NAO"}</td>`;
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
  const linhas = resumo.linhas ?? [];
  linhas.forEach((linha, index) => {
    const detalhe = resolveLinhaDetalhe(linha);
    const saidaCell = linha.saidaEm
      ? formatHoraMinuto(linha.saidaEm)
      : `<button class="quick-saida-btn dashboard-saida-btn" data-line-index="${index}" type="button" title="Registrar saida">&gt;</button>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.promotorNome ?? ""}</td>
      <td>${linha.fornecedorNome ?? ""}</td>
      <td>${formatHoraMinuto(linha.entradaEm)}</td>
      <td>${linha.usuarioEntrada ?? "-"}</td>
      <td>${saidaCell}</td>
      <td>${linha.usuarioSaida ?? "-"}</td>
      <td>${linha.liberadoPor ?? "-"}</td>
      <td><button class="detail-toggle" data-line-index="${index}" type="button">+</button></td>`;
    tr.style.backgroundColor = linha.saidaEm ? "#f3f4f6" : "#dcfce7";
    tbody.appendChild(tr);

    const detailTr = document.createElement("tr");
    detailTr.className = "dashboard-detail-row is-hidden";
    detailTr.dataset.lineIndex = String(index);
    detailTr.innerHTML = `
      <td colspan="8">
        <div class="dashboard-detail-content">
          <strong>Detalhes do Movimento</strong>
          <div><span>Observacao Entrada:</span> ${detalhe.observacaoEntrada || "-"}</div>
          <div><span>Observacao Saida:</span> ${detalhe.observacaoSaida || "-"}</div>
          <div><span>Usuário Entrada:</span> ${linha.usuarioEntrada ?? "-"}</div>
          <div><span>Usuário Saida:</span> ${linha.usuarioSaida ?? "-"}</div>
          <div><span>Liberação:</span> ${linha.liberadoPor ?? "-"}</div>
        </div>
      </td>`;
    tbody.appendChild(detailTr);
  });

  tbody.querySelectorAll(".detail-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.lineIndex;
      if (!index) return;
      const detailRow = tbody.querySelector(`.dashboard-detail-row[data-line-index="${index}"]`);
      if (!detailRow) return;
      const opened = detailRow.classList.toggle("is-hidden");
      btn.textContent = opened ? "+" : "-";
    });
  });

  tbody.querySelectorAll(".dashboard-saida-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.lineIndex);
      if (Number.isNaN(index)) return;
      const linha = linhas[index];
      if (!linha) return;
      openSaidaModal(linha);
    });
  });
}

function renderOperacaoDia(resumo) {
  const table = el("tblOperacaoDia");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const linhas = resumo?.linhas ?? [];
  linhas.forEach((linha, index) => {
    const detalhe = resolveLinhaDetalhe(linha);
    const saidaCell = linha.saidaEm
      ? formatHoraMinuto(linha.saidaEm)
      : `<button class="quick-saida-btn operacao-saida-btn" data-line-index="${index}" type="button" title="Registrar saida">&gt;</button>`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${linha.promotorNome ?? ""}</td>
      <td>${linha.fornecedorNome ?? ""}</td>
      <td>${formatHoraMinuto(linha.entradaEm)}</td>
      <td>${linha.usuarioEntrada ?? "-"}</td>
      <td>${saidaCell}</td>
      <td>${linha.usuarioSaida ?? "-"}</td>
      <td>${linha.liberadoPor ?? "-"}</td>
      <td><button class="detail-toggle op-detail-toggle" data-line-index="${index}" type="button">+</button></td>`;
    tr.style.backgroundColor = linha.saidaEm ? "#f3f4f6" : "#dcfce7";
    tbody.appendChild(tr);

    const detailTr = document.createElement("tr");
    detailTr.className = "dashboard-detail-row is-hidden";
    detailTr.dataset.lineIndex = String(index);
    detailTr.innerHTML = `
      <td colspan="8">
        <div class="dashboard-detail-content">
          <strong>Detalhes do Movimento</strong>
          <div><span>Observacao Entrada:</span> ${detalhe.observacaoEntrada || "-"}</div>
          <div><span>Observacao Saida:</span> ${detalhe.observacaoSaida || "-"}</div>
          <div><span>Usuário Entrada:</span> ${linha.usuarioEntrada ?? "-"}</div>
          <div><span>Usuário Saida:</span> ${linha.usuarioSaida ?? "-"}</div>
          <div><span>Liberação:</span> ${linha.liberadoPor ?? "-"}</div>
        </div>
      </td>`;
    tbody.appendChild(detailTr);
  });

  tbody.querySelectorAll(".op-detail-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lineIndex = btn.dataset.lineIndex;
      if (!lineIndex) return;
      const detailRow = tbody.querySelector(`.dashboard-detail-row[data-line-index="${lineIndex}"]`);
      if (!detailRow) return;
      const hiddenAfterToggle = detailRow.classList.toggle("is-hidden");
      btn.textContent = hiddenAfterToggle ? "+" : "-";
    });
  });

  tbody.querySelectorAll(".operacao-saida-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.lineIndex);
      if (Number.isNaN(index)) return;
      const linha = linhas[index];
      if (!linha) return;
      openSaidaModal(linha);
    });
  });
}

function normalizeDateTimeKey(value) {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 19);
}

function buildDashboardMovimentosMap(movimentos, dataRef, promotorIds) {
  const map = new Map();
  if (!Array.isArray(movimentos) || !dataRef) return map;

  movimentos.forEach((m) => {
    const promotorKey = String(m.promotorId ?? "");
    if (!promotorIds.has(promotorKey)) return;
    if (String(m.dataHora ?? "").slice(0, 10) !== dataRef) return;
    if (!map.has(promotorKey)) map.set(promotorKey, []);
    map.get(promotorKey).push(m);
  });

  map.forEach((list) => {
    list.sort((a, b) => String(a.dataHora ?? "").localeCompare(String(b.dataHora ?? "")));
  });

  return map;
}

function resolveLinhaDetalhe(linha) {
  const promotorKey = String(linha.promotorId ?? "");
  const movimentos = state.dashboardMovimentosMap.get(promotorKey) ?? [];
  const entradaKey = normalizeDateTimeKey(linha.entradaEm);
  const saidaKey = normalizeDateTimeKey(linha.saidaEm);

  const entrada = movimentos.find((m) =>
    m.tipo === "ENTRADA" && normalizeDateTimeKey(m.dataHora) === entradaKey);
  const saida = movimentos.find((m) =>
    m.tipo === "SAIDA" && normalizeDateTimeKey(m.dataHora) === saidaKey);

  return {
    observacaoEntrada: entrada?.observacao ?? "",
    observacaoSaida: saida?.observacao ?? ""
  };
}

function formatHoraMinuto(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  const text = String(value);
  const hhmm = text.match(/(\d{2}):(\d{2})/);
  return hhmm ? `${hhmm[1]}:${hhmm[2]}` : text;
}

function formatCodigo(value) {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return "-";
  return String(num).padStart(3, "0");
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildPromotorSearchLabel(promotor) {
  return `${formatCodigo(promotor?.codigo)} - ${promotor?.nome ?? "Sem nome"} - ${promotor?.fornecedorNome ?? "Sem fornecedor"}`;
}

function buildFornecedorSearchLabel(fornecedor) {
  return `${formatCodigo(fornecedor?.codigo)} - ${fornecedor?.nome ?? "Sem nome"}`;
}

function syncFornecedorSelect() {
  const fornecedorSearch = el("pFornecedorSearch");
  const fornecedorList = el("pFornecedoresList");
  const fornecedorHidden = el("pFornecedorId");
  const dashSelect = el("dashFornecedorId");
  if (!fornecedorSearch || !fornecedorList || !fornecedorHidden || !dashSelect) return;

  fornecedorList.innerHTML = "";
  dashSelect.innerHTML = "<option value=\"\">Todos</option>";
  state.cadastroFornecedorLookup = new Map();

  state.fornecedores
    .filter((f) => !isFornecedorSistema(f?.nome))
    .forEach((f) => {
    const optSearch = document.createElement("option");
    const label = buildFornecedorSearchLabel(f);
    optSearch.value = label;
    fornecedorList.appendChild(optSearch);
    state.cadastroFornecedorLookup.set(normalizeText(label), String(f.id));

    const optDash = document.createElement("option");
    optDash.value = f.id;
    optDash.textContent = `${formatCodigo(f.codigo)} - ${f.nome}`;
    dashSelect.appendChild(optDash);
  });

  const selectedFornecedor = state.fornecedores
    .filter((f) => !isFornecedorSistema(f?.nome))
    .find((f) => String(f.id) === String(fornecedorHidden.value));

  if (selectedFornecedor) {
    fornecedorSearch.value = buildFornecedorSearchLabel(selectedFornecedor);
  } else {
    fornecedorHidden.value = "";
    fornecedorSearch.value = "";
  }

  syncMovimentoPromotorSelect();
}

function isFornecedorSistema(nome) {
  const normalized = normalizeText(nome);
  return normalized === "fornecedor nao informado";
}

function syncMovimentoPromotorSelect() {
  const input = el("mPromotorSearch");
  const datalist = el("mPromotoresAtivosList");
  const hiddenPromotorId = el("mPromotorId");
  if (!input || !datalist || !hiddenPromotorId) return;
  const filtered = state.promotores.filter((p) => p.status === "ATIVO");

  datalist.innerHTML = "";
  state.movimentoPromotorLookup = new Map();

  filtered.forEach((p) => {
    const opt = document.createElement("option");
    const label = buildPromotorSearchLabel(p);
    opt.value = label;
    datalist.appendChild(opt);
    state.movimentoPromotorLookup.set(normalizeText(label), String(p.id));
  });

  if (filtered.length === 0) {
    setMovimentoMessage("Nenhum promotor ATIVO encontrado.");
  } else {
    setMovimentoMessage("");
  }

  const selectedPromotor = filtered.find((p) => String(p.id) === String(hiddenPromotorId.value));
  if (selectedPromotor) {
    input.value = buildPromotorSearchLabel(selectedPromotor);
  } else {
    hiddenPromotorId.value = "";
    input.value = "";
  }

  updateMovimentoFornecedorFromPromotor();
}

function updateMovimentoFornecedorFromPromotor() {
  const fornecedorField = el("mFornecedorNome");
  const promotorId = el("mPromotorId")?.value;
  if (!fornecedorField) return;

  if (!promotorId) {
    fornecedorField.value = "";
    return;
  }

  const promotor = state.promotores.find((p) => String(p.id) === String(promotorId));
  fornecedorField.value = promotor?.fornecedorNome ?? "";
}

function listMovimentoPromotoresAtivos() {
  return state.promotores.filter((p) => p.status === "ATIVO");
}

function findPromotoresByQuery(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return listMovimentoPromotoresAtivos().filter((p) => {
    const codigo = formatCodigo(p.codigo);
    const nome = normalizeText(p.nome);
    const fornecedor = normalizeText(p.fornecedorNome);
    const label = normalizeText(buildPromotorSearchLabel(p));
    const codigoSemZeros = String(Number(p.codigo ?? 0));
    const id = String(p.id ?? "");

    return label.includes(normalizedQuery) ||
      nome.includes(normalizedQuery) ||
      fornecedor.includes(normalizedQuery) ||
      normalizeText(codigo).includes(normalizedQuery) ||
      normalizeText(codigoSemZeros).includes(normalizedQuery) ||
      normalizeText(id).includes(normalizedQuery);
  });
}

function applyMovimentoPromotorSelection(promotor) {
  const input = el("mPromotorSearch");
  const hiddenPromotorId = el("mPromotorId");
  if (!input || !hiddenPromotorId) return;

  if (!promotor) {
    hiddenPromotorId.value = "";
    updateMovimentoFornecedorFromPromotor();
    return;
  }

  hiddenPromotorId.value = String(promotor.id);
  input.value = buildPromotorSearchLabel(promotor);
  updateMovimentoFornecedorFromPromotor();
}

function resolveMovimentoPromotorFromSearch(strict) {
  const input = el("mPromotorSearch");
  const hiddenPromotorId = el("mPromotorId");
  if (!input || !hiddenPromotorId) return;

  const typed = input.value.trim();
  if (!typed) {
    hiddenPromotorId.value = "";
    updateMovimentoFornecedorFromPromotor();
    if (strict) {
      setMovimentoMessage("Digite um promotor para continuar.");
    }
    return;
  }

  const exactByLabelId = state.movimentoPromotorLookup.get(normalizeText(typed));
  if (exactByLabelId) {
    const promotor = listMovimentoPromotoresAtivos().find((p) => String(p.id) === String(exactByLabelId));
    applyMovimentoPromotorSelection(promotor);
    setMovimentoMessage("");
    return;
  }

  const matches = findPromotoresByQuery(typed);
  if (matches.length === 1) {
    applyMovimentoPromotorSelection(matches[0]);
    setMovimentoMessage("");
    return;
  }

  hiddenPromotorId.value = "";
  updateMovimentoFornecedorFromPromotor();

  if (!strict) return;

  if (matches.length === 0) {
    setMovimentoMessage("Nenhum promotor ATIVO encontrado para o texto informado.");
    return;
  }

  setMovimentoMessage(`Foram encontrados ${matches.length} promotores. Refine a busca e use o Find.`);
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

function listCadastroFornecedores() {
  return state.fornecedores.filter((f) => !isFornecedorSistema(f?.nome));
}

function findFornecedoresByQuery(query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return listCadastroFornecedores().filter((f) => {
    const codigo = formatCodigo(f.codigo);
    const nome = normalizeText(f.nome);
    const label = normalizeText(buildFornecedorSearchLabel(f));
    const codigoSemZeros = String(Number(f.codigo ?? 0));
    const id = String(f.id ?? "");

    return label.includes(normalizedQuery) ||
      nome.includes(normalizedQuery) ||
      normalizeText(codigo).includes(normalizedQuery) ||
      normalizeText(codigoSemZeros).includes(normalizedQuery) ||
      normalizeText(id).includes(normalizedQuery);
  });
}

function applyCadastroFornecedorSelection(fornecedor) {
  const searchField = el("pFornecedorSearch");
  const hiddenField = el("pFornecedorId");
  if (!searchField || !hiddenField) return;

  if (!fornecedor) {
    hiddenField.value = "";
    return;
  }

  hiddenField.value = String(fornecedor.id);
  searchField.value = buildFornecedorSearchLabel(fornecedor);
}

function resolveCadastroFornecedorFromSearch(strict) {
  const searchField = el("pFornecedorSearch");
  const hiddenField = el("pFornecedorId");
  if (!searchField || !hiddenField) return;

  const typed = searchField.value.trim();
  if (!typed) {
    hiddenField.value = "";
    if (strict) {
      setMovimentoMessage("Digite um fornecedor valido no cadastro de promotor.");
    }
    return;
  }

  const exactByLabelId = state.cadastroFornecedorLookup.get(normalizeText(typed));
  if (exactByLabelId) {
    const fornecedor = listCadastroFornecedores().find((f) => String(f.id) === String(exactByLabelId));
    applyCadastroFornecedorSelection(fornecedor);
    setMovimentoMessage("");
    return;
  }

  const matches = findFornecedoresByQuery(typed);
  if (matches.length === 1) {
    applyCadastroFornecedorSelection(matches[0]);
    setMovimentoMessage("");
    return;
  }

  hiddenField.value = "";
  if (!strict) return;

  if (matches.length === 0) {
    setMovimentoMessage("Nenhum fornecedor encontrado para o texto informado.");
    return;
  }

  setMovimentoMessage(`Foram encontrados ${matches.length} fornecedores. Refine a busca e use o Find.`);
}

async function refreshDashboard() {
  state.dashboard = await apiRequest(buildDashboardQuery());
  const promotorIds = new Set((state.dashboard.linhas ?? []).map((linha) => String(linha.promotorId ?? "")));
  const movimentos = await apiRequest("/movimentos");
  state.dashboardMovimentosMap = buildDashboardMovimentosMap(
    movimentos,
    String(el("dashData").value || "").slice(0, 10),
    promotorIds
  );
  renderDashboard(state.dashboard);
  renderOperacaoDia(state.dashboard);
}

async function refreshData() {
  state.fornecedores = await apiRequest("/fornecedores");
  state.promotores = await apiRequest("/promotores");
  renderFornecedores(state.fornecedores);
  renderPromotores(state.promotores);
  syncFornecedorSelect();
  if (state.auth?.isAdmin) {
    await refreshUsuarios();
  } else {
    state.usuarios = [];
    renderUsuarios([]);
  }
  await refreshDashboard();
}

function computeMovimentosSignature(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return "0|none";
  }

  const sorted = [...list].sort((a, b) => String(a.dataHora ?? "").localeCompare(String(b.dataHora ?? "")));
  const latest = sorted[sorted.length - 1];
  return `${list.length}|${latest.id ?? "none"}|${latest.dataHora ?? "none"}|${latest.tipo ?? "none"}`;
}

async function checkBackendUpdates() {
  if (!state.auth || state.autoSyncRunning) return;
  state.autoSyncRunning = true;

  try {
    const movimentos = await silentApiRequest("/movimentos");
    const signature = computeMovimentosSignature(movimentos);

    if (state.autoSyncSignature === null) {
      state.autoSyncSignature = signature;
      return;
    }

    if (signature !== state.autoSyncSignature) {
      state.autoSyncSignature = signature;
      await refreshData();
      log("Atualizacao detectada no backend. Tela sincronizada automaticamente.");
    }
  } catch (e) {
    log("Falha no monitoramento automatico de atualizacoes", { error: e.message });
  } finally {
    state.autoSyncRunning = false;
  }
}

function startAutoSync() {
  stopAutoSync();
  state.autoSyncSignature = null;
  state.autoSyncIntervalId = setInterval(() => {
    checkBackendUpdates().catch(() => {});
  }, AUTO_SYNC_INTERVAL_MS);
}

function stopAutoSync() {
  if (state.autoSyncIntervalId) {
    clearInterval(state.autoSyncIntervalId);
    state.autoSyncIntervalId = null;
  }
  state.autoSyncSignature = null;
  state.autoSyncRunning = false;
}

async function refreshUsuarios() {
  if (!state.auth?.isAdmin) return;
  state.usuarios = await apiRequest("/auth/admin/usuarios");
  renderUsuarios(state.usuarios);
}

async function criarFornecedor() {
  setFornecedorMessage("");
  const payload = {
    nome: el("fNome").value.trim(),
    ativo: el("fAtivo").value === "true"
  };
  await apiRequest("/fornecedores", "POST", payload);
  await refreshData();
  el("fNome").value = "";
  el("fAtivo").value = "true";
  setFornecedorMessage("Fornecedor cadastrado com sucesso.");
}

async function criarPromotor() {
  setPromotorMessage("");
  resolveCadastroFornecedorFromSearch(true);
  const fornecedorId = el("pFornecedorId").value;
  if (!fornecedorId) {
    throw new Error("Informe um fornecedor valido no campo de busca");
  }

  const payload = {
    nome: el("pNome").value.trim(),
    telefone: el("pTelefone").value.trim(),
    fornecedorId: Number(fornecedorId),
    status: el("pStatus").value,
    fotoPath: ""
  };
  await apiRequest("/promotores", "POST", payload);
  await refreshData();
  el("pNome").value = "";
  el("pTelefone").value = "";
  el("pStatus").value = "ATIVO";
  el("pFornecedorSearch").value = "";
  el("pFornecedorId").value = "";
  setPromotorMessage("Promotor cadastrado com sucesso.");
}

async function registrarEntrada() {
  const promotorId = el("mPromotorId").value;
  if (!promotorId) {
    throw new Error("Informe um promotor valido no campo de busca");
  }

  const payload = {
    promotorId,
    responsavel: state.auth?.username ?? "",
    observacao: el("mObservacao").value.trim()
  };

  await apiRequest("/movimentos/entrada", "POST", payload);
  el("mObservacao").value = "";
  setMovimentoMessage("Entrada registrada com sucesso.");
  await refreshData();
}

async function registrarSaida() {
  const promotorId = el("mPromotorId").value;
  if (!promotorId) {
    throw new Error("Informe um promotor valido no campo de busca");
  }

  const liberadoPor = el("mLiberadoPor").value.trim();
  if (!liberadoPor) {
    throw new Error("Informe quem liberou a saida");
  }

  await registrarSaidaPorPromotor(promotorId, liberadoPor, el("mObservacao").value.trim());
  el("mObservacao").value = "";
  setMovimentoMessage("Saida registrada com sucesso.");
}

async function registrarSaidaPorPromotor(promotorId, liberadoPor, observacao) {
  const payload = {
    promotorId,
    responsavel: state.auth?.username ?? "",
    liberadoPor,
    observacao: observacao ?? ""
  };

  await apiRequest("/movimentos/saida", "POST", payload);
  await refreshData();
}

function setSaidaModalMessage(message) {
  const field = el("saidaModalMessage");
  if (!field) return;
  field.textContent = message || "";
}

function openSaidaModal(linha) {
  if (!linha?.promotorId) return;

  state.saidaModalContext = {
    promotorId: String(linha.promotorId),
    promotorNome: linha.promotorNome ?? "",
    fornecedorNome: linha.fornecedorNome ?? ""
  };

  el("saidaModalPromotorId").value = String(linha.promotorId);
  el("saidaModalResumo").textContent = `${linha.promotorNome ?? ""} - ${linha.fornecedorNome ?? ""}`;
  el("saidaModalLiberadoPor").value = "";
  el("saidaModalObservacao").value = "";
  setSaidaModalMessage("");
  el("saidaModal").classList.remove("is-hidden");
  el("saidaModal").setAttribute("aria-hidden", "false");
  el("saidaModalLiberadoPor").focus();
}

function closeSaidaModal() {
  state.saidaModalContext = null;
  setSaidaModalMessage("");
  el("saidaModal").classList.add("is-hidden");
  el("saidaModal").setAttribute("aria-hidden", "true");
}

async function salvarSaidaModal() {
  const ctx = state.saidaModalContext;
  if (!ctx?.promotorId) {
    closeSaidaModal();
    return;
  }

  const liberadoPor = el("saidaModalLiberadoPor").value.trim();
  if (!liberadoPor) {
    setSaidaModalMessage("Informe quem liberou a saida.");
    return;
  }

  const observacao = el("saidaModalObservacao").value.trim();
  const saveBtn = el("btnSalvarSaidaModal");
  saveBtn.disabled = true;
  try {
    await registrarSaidaPorPromotor(ctx.promotorId, liberadoPor, observacao);
    closeSaidaModal();
    setMovimentoMessage("Saida registrada com sucesso.");
  } catch (e) {
    setSaidaModalMessage(`Falha ao registrar saida: ${e.message}`);
    log("Falha ao registrar saida pelo modal", { error: e.message });
  } finally {
    saveBtn.disabled = false;
  }
}

async function login() {
  const baseUrl = window.location.origin;
  const username = el("loginUsername").value.trim();
  const password = el("loginPassword").value;
  if (!username || !password) {
    throw new Error("Digite Usuário e Senha");
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
  startAutoSync();
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
  el("uTempPassword").value = response.senhaTemporaria ?? "";
  log("Senha resetada por admin", { username: response.username });
}

async function criarUsuario() {
  if (!state.auth?.isAdmin) {
    throw new Error("Apenas ADMIN pode cadastrar usuario");
  }

  const username = el("uUsername").value.trim();
  const perfil = el("uPerfil").value;
  if (!username) {
    throw new Error("Informe o username");
  }

  const response = await apiRequest("/auth/admin/usuarios", "POST", { username, perfil });
  el("uTempPassword").value = response.senhaTemporaria ?? "";
  el("resetTempPassword").value = response.senhaTemporaria ?? "";
  el("uUsername").value = "";
  await refreshUsuarios();
  log("Usuario criado por admin", { username: response.username, perfil: response.perfil });
}

function logout() {
  stopAutoSync();
  state.auth = null;
  state.pendingAuth = null;
  showLoginView();
  hideForceChangeBox();
  el("currentUser").value = "";
  el("currentRole").value = "";
  el("baseUrl").value = "";
  el("loginPassword").value = "";
  el("profileUserName").textContent = "user";
  el("profileRoleName").textContent = getRoleDisplayName("OPERATOR");
  el("resetTempPassword").value = "";
  el("uTempPassword").value = "";
  updateProfileInitials("U");
  applyProfileToUI();
  setLoginMessage("");
}

function getRoleDisplayName(role) {
  if (role === "VIEWER") return "Padrão";
  if (role === "OPERATOR") return "Prevenção";
  return role || "";
}

function bindActions() {
  const triggerLogin = () => {
    login().catch((e) => {
      if (e.message === "Digite Usuário e Senha") {
        setLoginMessage(e.message);
        return;
      }
      setLoginMessage(`Falha no login: ${e.message}`);
      log("Falha no login", { error: e.message });
    });
  };

  el("btnOpenProfile").addEventListener("click", () => activateTab("tab-perfil"));
  el("btnLogin").addEventListener("click", triggerLogin);
  el("loginUsername").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    triggerLogin();
  });
  el("loginPassword").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    triggerLogin();
  });
  el("btnChangePassword").addEventListener("click", () => {
    alterarSenhaObrigatoria().catch((e) => {
      setLoginMessage(`Falha ao trocar senha: ${e.message}`);
      log("Falha troca obrigatoria de senha", { error: e.message });
    });
  });

  el("btnLogout").addEventListener("click", logout);
  el("btnRefreshDashboard").addEventListener("click", () => refreshDashboard().catch((e) => log("Falha dashboard", { error: e.message })));
  el("btnRefreshUsuarios").addEventListener("click", () => refreshUsuarios().catch((e) => log("Falha usuarios", { error: e.message })));
  el("btnCriarFornecedor").addEventListener("click", () => {
    criarFornecedor().catch((e) => {
      setFornecedorMessage(`Falha ao cadastrar fornecedor: ${e.message}`);
      log("Falha ao criar fornecedor", { error: e.message });
    });
  });
  el("btnCriarPromotor").addEventListener("click", () => {
    criarPromotor().catch((e) => {
      setPromotorMessage(`Falha ao cadastrar promotor: ${e.message}`);
      log("Falha ao criar", { error: e.message });
    });
  });
  el("pFornecedorSearch").addEventListener("input", () => resolveCadastroFornecedorFromSearch(false));
  el("pFornecedorSearch").addEventListener("change", () => resolveCadastroFornecedorFromSearch(true));
  el("pFornecedorSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resolveCadastroFornecedorFromSearch(true);
  });
  el("btnFindFornecedor").addEventListener("click", () => resolveCadastroFornecedorFromSearch(true));
  el("btnRegistrarEntrada").addEventListener("click", () => {
    registrarEntrada().catch((e) => {
      setMovimentoMessage(`Falha ao registrar entrada: ${e.message}`);
      log("Falha ao registrar entrada", { error: e.message });
    });
  });
  el("btnRegistrarSaida").addEventListener("click", () => {
    registrarSaida().catch((e) => {
      setMovimentoMessage(`Falha ao registrar saida: ${e.message}`);
      log("Falha ao registrar saida", { error: e.message });
    });
  });
  el("mPromotorSearch").addEventListener("input", () => resolveMovimentoPromotorFromSearch(false));
  el("mPromotorSearch").addEventListener("change", () => resolveMovimentoPromotorFromSearch(true));
  el("mPromotorSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resolveMovimentoPromotorFromSearch(true);
  });
  el("btnFindPromotor").addEventListener("click", () => resolveMovimentoPromotorFromSearch(true));
  el("btnCancelarSaidaModal").addEventListener("click", closeSaidaModal);
  el("btnSalvarSaidaModal").addEventListener("click", () => {
    salvarSaidaModal().catch((e) => {
      setSaidaModalMessage(`Falha ao registrar saida: ${e.message}`);
      log("Falha ao salvar saida pelo modal", { error: e.message });
    });
  });
  el("saidaModal").addEventListener("click", (event) => {
    if (event.target !== el("saidaModal")) return;
    closeSaidaModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (el("saidaModal").classList.contains("is-hidden")) return;
    closeSaidaModal();
  });
  el("btnCriarUsuario").addEventListener("click", () => criarUsuario().catch((e) => log("Falha ao criar usuario", { error: e.message })));
  el("btnResetSenha").addEventListener("click", () => resetarSenhaUsuario().catch((e) => log("Falha reset de senha", { error: e.message })));
  el("btnSaveProfile").addEventListener("click", saveProfileFromForm);
  el("btnRemoveProfileAvatar").addEventListener("click", removerFotoPerfil);

  el("btnFiltroPromotor").addEventListener("click", () => {
    const fornecedor = el("filtroFornecedorPromotor").value.trim().toLowerCase();
    if (!fornecedor) return renderPromotores(state.promotores);
    renderPromotores(state.promotores.filter((p) => (p.fornecedorNome ?? "").toLowerCase().includes(fornecedor)));
  });

}

bindActions();
bindProfileAvatar();
setupTabs();
initDashboardDefaults();
loadSavedLogin();
showLoginView();

