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
  autoSyncRunning: false,
  editingUser: null,
  userFormMode: "view",
  userFilter: "",
  confirmResolver: null,
  editingFornecedorId: null,
  fornecedorFormMode: "view",
  fornecedorFilter: "",
  editingPromotorId: null,
  promotorFormMode: "view",
  promotorFilter: ""
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

function setFornecedorMessage(message, isError = false) {
  const field = el("fMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function setPromotorMessage(message, isError = false) {
  const field = el("pMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function showConfirmDialog({
  title = "Confirmação",
  message = "",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  showCancel = true,
  centered = false,
  secretValue = "",
  footnote = ""
} = {}) {
  return new Promise((resolve) => {
    state.confirmResolver = resolve;
    const hasSecret = Boolean(secretValue);
    const hasFootnote = Boolean(footnote);
    el("confirmModalTitle").textContent = title;
    el("confirmModalMessage").textContent = message;
    el("confirmModalSecretWrap").classList.toggle("is-hidden", !hasSecret);
    el("confirmModalSecret").value = hasSecret ? String(secretValue) : "";
    el("confirmModalFootnote").classList.toggle("is-hidden", !hasFootnote);
    el("confirmModalFootnote").textContent = hasFootnote ? footnote : "";
    el("confirmModal").querySelector(".confirm-card").classList.toggle("is-centered", centered);
    el("btnConfirmModalOk").textContent = confirmText;
    el("btnConfirmModalCancel").textContent = cancelText;
    el("btnConfirmModalCancel").classList.toggle("is-hidden", !showCancel);
    el("confirmModal").classList.remove("is-hidden");
    el("confirmModal").setAttribute("aria-hidden", "false");
    el("btnConfirmModalOk").focus();
  });
}

function resolveConfirmDialog(value) {
  const resolver = state.confirmResolver;
  state.confirmResolver = null;
  el("confirmModalSecret").value = "";
  el("confirmModal").classList.add("is-hidden");
  el("confirmModal").setAttribute("aria-hidden", "true");
  if (resolver) resolver(value);
}

function setUsuarioMessage(message, isError = false) {
  const field = el("uMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function setUserFieldError(fieldId, hasError) {
  const field = el(fieldId);
  if (!field) return;
  field.classList.toggle("input-error", hasError);
}

function setFornecedorFieldError(fieldId, hasError) {
  const field = el(fieldId);
  if (!field) return;
  field.classList.toggle("input-error", hasError);
}

function setPromotorFieldError(fieldId, hasError) {
  const field = el(fieldId);
  if (!field) return;
  field.classList.toggle("input-error", hasError);
}

function setUserFormMode(mode) {
  state.userFormMode = mode;
  const isView = mode === "view";
  const isEdit = mode === "edit";

  el("uUsername").disabled = isView;
  el("uPerfil").disabled = isView;
  el("uStatus").disabled = !isEdit;
  el("btnNovoUsuario").disabled = !isView;
  el("btnCancelarUsuario").disabled = isView;
  el("btnSalvarUsuario").disabled = isView;
  el("btnResetSenha").disabled = !isEdit;
  el("btnResetSenha").classList.toggle("is-hidden", !isEdit);
  el("uEditModeBadge").classList.toggle("is-hidden", !isEdit);

  if (mode === "new") {
    el("uStatus").value = "ATIVO";
  }
}

function clearUserForm() {
  state.editingUser = null;
  el("uCodigo").value = "";
  el("uUsername").value = "";
  el("uPerfil").value = "VIEWER";
  el("uStatus").value = "ATIVO";
  setUserFieldError("uUsername", false);
}

function fillUserFormForEdit(user) {
  state.editingUser = user.username;
  el("uCodigo").value = formatCodigo(user.codigo);
  el("uUsername").value = user.username ?? "";
  el("uPerfil").value = user.perfil ?? "VIEWER";
  el("uStatus").value = user.status ?? "ATIVO";
}

function setFornecedorFormMode(mode) {
  state.fornecedorFormMode = mode;
  const isView = mode === "view";
  const isEdit = mode === "edit";
  el("fNome").disabled = isView;
  el("fAtivo").disabled = isView;
  el("btnNovoFornecedor").disabled = !isView;
  el("btnCancelarFornecedor").disabled = isView;
  el("btnSalvarFornecedor").disabled = isView;
  el("fEditModeBadge").classList.toggle("is-hidden", !isEdit);
}

function clearFornecedorForm() {
  state.editingFornecedorId = null;
  el("fCodigo").value = "";
  el("fNome").value = "";
  el("fAtivo").value = "true";
  setFornecedorFieldError("fNome", false);
}

function fillFornecedorFormForEdit(fornecedor) {
  state.editingFornecedorId = fornecedor.id;
  el("fCodigo").value = formatCodigo(fornecedor.codigo);
  el("fNome").value = fornecedor.nome ?? "";
  el("fAtivo").value = fornecedor.ativo ? "true" : "false";
}

function setPromotorFormMode(mode) {
  state.promotorFormMode = mode;
  const isView = mode === "view";
  const isEdit = mode === "edit";
  el("pNome").disabled = isView;
  el("pTelefone").disabled = isView;
  el("pFornecedorSearch").disabled = isView;
  el("btnFindFornecedor").disabled = isView;
  el("pStatus").disabled = isView;
  el("btnNovoPromotor").disabled = !isView;
  el("btnCancelarPromotor").disabled = isView;
  el("btnSalvarPromotor").disabled = isView;
  el("pEditModeBadge").classList.toggle("is-hidden", !isEdit);
}

function clearPromotorForm() {
  state.editingPromotorId = null;
  el("pCodigo").value = "";
  el("pNome").value = "";
  el("pTelefone").value = "";
  el("pStatus").value = "ATIVO";
  el("pFornecedorSearch").value = "";
  el("pFornecedorId").value = "";
  setPromotorFieldError("pNome", false);
  setPromotorFieldError("pFornecedorSearch", false);
}

function fillPromotorFormForEdit(promotor) {
  state.editingPromotorId = promotor.id;
  el("pCodigo").value = formatCodigo(promotor.codigo);
  el("pNome").value = promotor.nome ?? "";
  el("pTelefone").value = promotor.telefone ?? "";
  el("pStatus").value = promotor.status ?? "ATIVO";
  el("pFornecedorId").value = String(promotor.fornecedorId ?? "");
  const fornecedor = listCadastroFornecedores().find((f) => String(f.id) === String(promotor.fornecedorId));
  el("pFornecedorSearch").value = fornecedor
    ? buildFornecedorSearchLabel(fornecedor)
    : `${formatCodigo(promotor.fornecedorCodigo)} - ${promotor.fornecedorNome ?? ""}`;
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
  el("tabUsersBtn").classList.toggle("is-hidden", !state.auth.canManageUsers);
  el("tabIntegracaoBtn").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("tabMovimentosBtn").classList.toggle("is-hidden", !state.auth.canOperate);
  el("adminUsersCard").classList.toggle("is-hidden", !state.auth.canManageUsers);
  el("adminUsersListCard").classList.toggle("is-hidden", !state.auth.canManageUsers);
  el("btnOpenProfile").classList.toggle("is-hidden", !state.auth.isAdmin);
  el("tab-perfil").classList.toggle("is-hidden", !state.auth.isAdmin);
  if (!state.auth.canManageCatalog) {
    clearFornecedorForm();
    setFornecedorFormMode("view");
    el("fornecedorFormActions").classList.add("is-hidden");
    clearPromotorForm();
    setPromotorFormMode("view");
    el("promotorFormActions").classList.add("is-hidden");
  } else {
    el("fornecedorFormActions").classList.remove("is-hidden");
    el("promotorFormActions").classList.remove("is-hidden");
  }

  if (!state.auth.isAdmin && el("tab-perfil").classList.contains("is-active")) {
    activateTab("tab-dashboard");
  }
  if (!state.auth.canOperate && el("tab-movimentos").classList.contains("is-active")) {
    activateTab("tab-dashboard");
  }
  if (!state.auth.canManageUsers && el("tab-usuarios").classList.contains("is-active")) {
    activateTab("tab-dashboard");
  }
  if (!state.auth.isAdmin && el("tab-integracao").classList.contains("is-active")) {
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

async function removerFotoPerfil() {
  const confirmar = await showConfirmDialog({
    title: "Remover foto",
    message: "Deseja realmente remover a foto do perfil?"
  });
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
    throw new Error("Sessão não autenticada");
  }

  const { response, data } = await rawRequest(path, method, creds, body);

  if (!response.ok) {
    log(`${method} ${path} -> ${response.status}`, data);
    const error = new Error(data?.message || `${response.status} ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  log(`${method} ${path} -> ${response.status}`, data);
  return data;
}

async function silentApiRequest(path, method = "GET", body = null, auth = null) {
  const creds = auth || state.auth;
  if (!creds) {
    throw new Error("Sessão não autenticada");
  }

  const { response, data } = await rawRequest(path, method, creds, body);
  if (!response.ok) {
    const error = new Error(data?.message || `${response.status} ${response.statusText}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function loadSession(auth) {
  const sessionData = await apiRequest("/auth/sessao", "GET", null, auth);
  const role = sessionData.perfil;
  const isAdmin = role === "ADMIN";
  const isGestor = role === "GESTOR";
  const canManageUsers = isAdmin || isGestor;
  const canOperate = role === "OPERATOR" || isAdmin;
  const canManageCatalog = canOperate || isGestor;
  return {
    username: sessionData.username,
    role,
    isAdmin,
    isGestor,
    canManageUsers,
    canOperate,
    canManageCatalog,
    mustChangePassword: sessionData.precisaTrocarSenha
  };
}

function renderPromotores(list) {
  const tbody = el("tblPromotores").querySelector("tbody");
  tbody.innerHTML = "";
  const termo = normalizeText(state.promotorFilter || "");
  const filtrados = list.filter((p) => {
    if (!termo) return true;
    const codigo = normalizeText(formatCodigo(p.codigo));
    const nome = normalizeText(p.nome);
    const fornecedor = normalizeText(p.fornecedorNome);
    const status = normalizeText(p.status);
    const telefone = normalizeText(p.telefone);
    return codigo.includes(termo)
      || nome.includes(termo)
      || fornecedor.includes(termo)
      || status.includes(termo)
      || telefone.includes(termo);
  });

  filtrados.forEach((p) => {
    const status = (p.status ?? "").toUpperCase();
    const statusClass = status === "ATIVO"
      ? "status-badge is-active"
      : "status-badge is-inactive";
    const actionButton = state.auth?.canManageCatalog
      ? `<button class="btn-table-small promotor-edit-btn" type="button" data-id="${p.id}">Editar</button>`
      : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatCodigo(p.codigo)}</td>
      <td>${p.nome ?? ""}</td>
      <td>${formatCodigo(p.fornecedorCodigo)} - ${p.fornecedorNome ?? ""}</td>
      <td><span class="${statusClass}">${status || "-"}</span></td>
      <td>${p.telefone ?? ""}</td>
      <td>${actionButton}</td>`;
    tbody.appendChild(tr);
  });

  if (!state.auth?.canManageCatalog) return;

  tbody.querySelectorAll(".promotor-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = String(btn.dataset.id || "");
      if (!id) return;
      const promotor = state.promotores.find((item) => String(item.id) === id);
      if (!promotor) return;
      const confirmar = await showConfirmDialog({
        title: "Editar promotor",
        message: `Deseja editar o promotor ${promotor.nome}?`
      });
      if (!confirmar) return;
      fillPromotorFormForEdit(promotor);
      setPromotorFormMode("edit");
      setPromotorMessage("");
    });
  });
}

function renderFornecedores(list) {
  const table = el("tblFornecedores");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  const termo = normalizeText(state.fornecedorFilter || "");
  const filtrados = list
    .filter((f) => !isFornecedorSistema(f?.nome))
    .filter((f) => {
      if (!termo) return true;
      const codigo = normalizeText(formatCodigo(f.codigo));
      const nome = normalizeText(f.nome);
      const status = normalizeText(f.ativo ? "ATIVO" : "INATIVO");
      return codigo.includes(termo) || nome.includes(termo) || status.includes(termo);
    });

  filtrados.forEach((f) => {
    const statusText = f.ativo ? "ATIVO" : "INATIVO";
    const statusClass = f.ativo ? "status-badge is-active" : "status-badge is-inactive";
    const tr = document.createElement("tr");
    const actionButton = state.auth?.canManageCatalog
      ? `<button class="btn-table-small fornecedor-edit-btn" type="button" data-id="${f.id}">Editar</button>`
      : "";
    tr.innerHTML = `
      <td>${formatCodigo(f.codigo)}</td>
      <td>${f.nome ?? ""}</td>
      <td><span class="${statusClass}">${statusText}</span></td>
      <td>${actionButton}</td>`;
    tbody.appendChild(tr);
  });

  if (!state.auth?.canManageCatalog) return;

  tbody.querySelectorAll(".fornecedor-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      if (Number.isNaN(id)) return;
      const fornecedor = state.fornecedores.find((item) => item.id === id);
      if (!fornecedor) return;
      const confirmar = await showConfirmDialog({
        title: "Editar fornecedor",
        message: `Deseja editar o fornecedor ${fornecedor.nome}?`
      });
      if (!confirmar) return;
      fillFornecedorFormForEdit(fornecedor);
      setFornecedorFormMode("edit");
      setFornecedorMessage("");
    });
  });
}

function renderUsuarios(list) {
  const table = el("tblUsuarios");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  const termo = normalizeText(state.userFilter || "");
  const filtrados = termo
    ? list.filter((u) => {
      const codigo = normalizeText(formatCodigo(u.codigo));
      const username = normalizeText(u.username);
      const perfil = normalizeText(u.perfil);
      const perfilLabel = normalizeText(getRoleDisplayName(u.perfil));
      const status = normalizeText(u.status);
      return codigo.includes(termo)
        || username.includes(termo)
        || perfil.includes(termo)
        || perfilLabel.includes(termo)
        || status.includes(termo);
    })
    : list;

  filtrados.forEach((u) => {
    const status = (u.status ?? "ATIVO").toUpperCase();
    const statusClass = status === "INATIVO" ? "status-badge is-inactive" : "status-badge is-active";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatCodigo(u.codigo)}</td>
      <td>${u.username ?? ""}</td>
      <td>${getRoleDisplayName(u.perfil ?? "")}</td>
      <td><span class="${statusClass}">${status}</span></td>
      <td>${u.precisaTrocarSenha ? "SIM" : "NÃO"}</td>
      <td><button class="btn-table-small user-edit-btn" type="button" data-username="${u.username ?? ""}" data-perfil="${u.perfil ?? ""}">Editar</button></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".user-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const username = String(btn.dataset.username || "").trim();
      if (!username) return;
      const confirmar = await showConfirmDialog({
        title: "Editar usuário",
        message: `Deseja editar o usuário ${username}?`
      });
      if (!confirmar) return;

      const user = state.usuarios.find((u) => String(u.username) === username);
      if (!user) return;
      fillUserFormForEdit(user);
      setUserFormMode("edit");
      setUsuarioMessage("");
    });
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
      : `<button class="quick-saida-btn dashboard-saida-btn" data-line-index="${index}" type="button" title="Registrar saída">&gt;</button>`;
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
          <div><span>Observação Entrada:</span> ${detalhe.observacaoEntrada || "-"}</div>
          <div><span>Observação Saída:</span> ${detalhe.observacaoSaida || "-"}</div>
          <div><span>Usuário Entrada:</span> ${linha.usuarioEntrada ?? "-"}</div>
          <div><span>Usuário Saída:</span> ${linha.usuarioSaida ?? "-"}</div>
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
      : `<button class="quick-saida-btn operacao-saida-btn" data-line-index="${index}" type="button" title="Registrar saída">&gt;</button>`;
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
          <div><span>Observação Entrada:</span> ${detalhe.observacaoEntrada || "-"}</div>
          <div><span>Observação Saída:</span> ${detalhe.observacaoSaida || "-"}</div>
          <div><span>Usuário Entrada:</span> ${linha.usuarioEntrada ?? "-"}</div>
          <div><span>Usuário Saída:</span> ${linha.usuarioSaida ?? "-"}</div>
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
  return normalized === "fornecedor não informado";
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

  setMovimentoMessage(`Foram encontrados ${matches.length} promotores. Refine a busca e use o Localizar.`);
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
      setPromotorMessage("Digite um fornecedor válido no cadastro de promotor.");
    }
    return;
  }

  const exactByLabelId = state.cadastroFornecedorLookup.get(normalizeText(typed));
  if (exactByLabelId) {
    const fornecedor = listCadastroFornecedores().find((f) => String(f.id) === String(exactByLabelId));
    applyCadastroFornecedorSelection(fornecedor);
    setPromotorMessage("");
    return;
  }

  const matches = findFornecedoresByQuery(typed);
  if (matches.length === 1) {
    applyCadastroFornecedorSelection(matches[0]);
    setPromotorMessage("");
    return;
  }

  hiddenField.value = "";
  if (!strict) return;

  if (matches.length === 0) {
    setPromotorMessage("Nenhum fornecedor encontrado para o texto informado.");
    return;
  }

  setPromotorMessage(`Foram encontrados ${matches.length} fornecedores. Refine a busca e use o Localizar.`);
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
  if (state.auth?.canManageUsers) {
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
  if (!state.auth?.canManageUsers) return;
  state.usuarios = await apiRequest("/auth/admin/usuarios");
  renderUsuarios(state.usuarios);
}

async function criarFornecedor() {
  if (!state.auth?.canManageCatalog) {
    throw new Error("Sem permissão para cadastrar/editar fornecedor");
  }
  if (state.fornecedorFormMode === "view") {
    throw new Error("Clique em Novo ou Editar para habilitar o formulário");
  }

  const nome = el("fNome").value.trim();
  const ativo = el("fAtivo").value === "true";
  if (!nome) {
    setFornecedorFieldError("fNome", true);
    throw new Error("Obrigatório informar o Fornecedor");
  }
  setFornecedorFieldError("fNome", false);

  const confirmText = state.fornecedorFormMode === "edit"
    ? `Deseja salvar as alterações do fornecedor ${nome}?`
    : `Deseja salvar o novo fornecedor ${nome}?`;
  const confirmar = await showConfirmDialog({
    title: "Salvar fornecedor",
    message: confirmText
  });
  if (!confirmar) return;

  if (state.fornecedorFormMode === "edit") {
    if (!state.editingFornecedorId) {
      throw new Error("Não foi possível identificar o fornecedor em edição");
    }
    await apiRequest(`/fornecedores/${state.editingFornecedorId}`, "PUT", { nome, ativo });
    log("Fornecedor atualizado", { id: state.editingFornecedorId, nome, ativo });
  } else {
    await apiRequest("/fornecedores", "POST", { nome, ativo });
    log("Fornecedor criado", { nome, ativo });
  }

  clearFornecedorForm();
  setFornecedorFormMode("view");
  setFornecedorMessage("");
  await refreshData();
}

async function criarPromotor() {
  if (!state.auth?.canManageCatalog) {
    throw new Error("Sem permissão para cadastrar/editar promotor");
  }
  if (state.promotorFormMode === "view") {
    throw new Error("Clique em Novo ou Editar para habilitar o formulário");
  }

  const nome = el("pNome").value.trim();
  if (!nome) {
    setPromotorFieldError("pNome", true);
    throw new Error("Obrigatório informar o Promotor");
  }
  setPromotorFieldError("pNome", false);

  resolveCadastroFornecedorFromSearch(true);
  const fornecedorId = el("pFornecedorId").value;
  if (!fornecedorId) {
    setPromotorFieldError("pFornecedorSearch", true);
    throw new Error("Informe um fornecedor válido no campo de busca");
  }
  setPromotorFieldError("pFornecedorSearch", false);

  const payload = {
    nome,
    telefone: el("pTelefone").value.trim(),
    fornecedorId: Number(fornecedorId),
    status: el("pStatus").value,
    fotoPath: ""
  };

  const confirmText = state.promotorFormMode === "edit"
    ? `Deseja salvar as alterações do promotor ${nome}?`
    : `Deseja salvar o novo promotor ${nome}?`;
  const confirmar = await showConfirmDialog({
    title: "Salvar promotor",
    message: confirmText
  });
  if (!confirmar) return;

  if (state.promotorFormMode === "edit") {
    if (!state.editingPromotorId) {
      throw new Error("Não foi possível identificar o promotor em edição");
    }
    await apiRequest(`/promotores/${state.editingPromotorId}`, "PUT", payload);
    log("Promotor atualizado", { id: state.editingPromotorId, nome, fornecedorId: payload.fornecedorId, status: payload.status });
  } else {
    await apiRequest("/promotores", "POST", payload);
    log("Promotor criado", { nome, fornecedorId: payload.fornecedorId, status: payload.status });
  }

  clearPromotorForm();
  setPromotorFormMode("view");
  setPromotorMessage("");
  await refreshData();
}

async function registrarEntrada() {
  const promotorId = el("mPromotorId").value;
  if (!promotorId) {
    throw new Error("Informe um promotor válido no campo de busca");
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
    throw new Error("Informe um promotor válido no campo de busca");
  }

  const liberadoPor = el("mLiberadoPor").value.trim();
  if (!liberadoPor) {
    throw new Error("Informe quem liberou a saída");
  }

  await registrarSaidaPorPromotor(promotorId, liberadoPor, el("mObservacao").value.trim());
  el("mObservacao").value = "";
  setMovimentoMessage("Saída registrada com sucesso.");
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
    setSaidaModalMessage("Informe quem liberou a saída.");
    return;
  }

  const observacao = el("saidaModalObservacao").value.trim();
  const saveBtn = el("btnSalvarSaidaModal");
  saveBtn.disabled = true;
  try {
    await registrarSaidaPorPromotor(ctx.promotorId, liberadoPor, observacao);
    closeSaidaModal();
    setMovimentoMessage("Saída registrada com sucesso.");
  } catch (e) {
    setSaidaModalMessage(`Falha ao registrar saída: ${e.message}`);
    log("Falha ao registrar saída pelo modal", { error: e.message });
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

  const session = {
    baseUrl,
    username,
    password,
    role: "",
    isAdmin: false,
    isGestor: false,
    canManageUsers: false,
    canOperate: false,
    canManageCatalog: false
  };
  setLoginMessage("");
  const sessionInfo = await loadSession(session);

  if (sessionInfo.mustChangePassword) {
    state.pendingAuth = { ...session, ...sessionInfo };
    showForceChangeBox();
    setLoginMessage("Senha temporária detectada. Troque a senha para continuar.");
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
  log("Login efetuado", { usuário: fullSession.username, perfil: fullSession.role });
}

async function alterarSenhaObrigatoria() {
  if (!state.pendingAuth) {
    throw new Error("Não existe sessão pendente para troca de senha");
  }

  const novaSenha = el("newPassword").value;
  const confirmarSenha = el("confirmPassword").value;
  if (!novaSenha || !confirmarSenha) {
    throw new Error("Informe e confirme a nova senha");
  }
  if (novaSenha !== confirmarSenha) {
    throw new Error("As senhas não conferem");
  }
  if (novaSenha.length < 6) {
    throw new Error("A nova senha deve ter no mínimo 6 caracteres");
  }

  await apiRequest("/auth/alterar-senha", "POST", { novaSenha }, state.pendingAuth);
  const nextAuth = { ...state.pendingAuth, password: novaSenha };
  const updatedSession = await loadSession(nextAuth);
  if (updatedSession.mustChangePassword) {
    throw new Error("Não foi possível concluir a troca obrigatória de senha");
  }

  await completeLogin({ ...nextAuth, ...updatedSession });
}

async function resetarSenhaUsuario() {
  if (!state.auth?.canManageUsers) {
    throw new Error("Apenas Admin/Gestor pode resetar senha");
  }

  if (state.userFormMode !== "edit") {
    throw new Error("Reset de senha habilitado somente em edição");
  }

  const username = (state.editingUser || "").trim();
  if (!username) {
    throw new Error("Informe o usuário para reset");
  }

  const confirmar = await showConfirmDialog({
    title: "Resetar senha",
    message: `Deseja resetar a senha do usuário ${username}?`
  });
  if (!confirmar) return;

  const response = await apiRequest("/auth/admin/resetar-senha", "POST", { username });
  setUsuarioMessage("");
  await showConfirmDialog({
    title: "Senha temporária",
    message: "",
    centered: true,
    secretValue: response.senhaTemporaria ?? "-",
    footnote: "Essa senha será exibida somente nesta vez.",
    confirmText: "OK",
    showCancel: false
  });
  log("Senha resetada por gestor/admin", { username: response.username });
}

async function criarUsuario() {
  if (!state.auth?.canManageUsers) {
    throw new Error("Apenas Admin/Gestor pode cadastrar usuário");
  }

  if (state.userFormMode === "view") {
    throw new Error("Clique em Novo ou Editar para habilitar o formulario");
  }

  const username = el("uUsername").value.trim();
  const perfil = el("uPerfil").value;
  const status = state.userFormMode === "edit"
    ? el("uStatus").value
    : "ATIVO";
  if (!username) {
    setUserFieldError("uUsername", true);
    throw new Error("Obrigatório informar o Usuário");
  }
  setUserFieldError("uUsername", false);
  if (!perfil) {
    throw new Error("Informe o perfil");
  }
  if (!status) {
    throw new Error("Informe o status");
  }

  const confirmText = state.userFormMode === "edit"
    ? `Deseja salvar as alterações do usuário ${username}?`
    : `Deseja salvar o novo usuário ${username}?`;
  const confirmar = await showConfirmDialog({
    title: "Salvar usuário",
    message: confirmText
  });
  if (!confirmar) return;

  if (state.userFormMode === "edit") {
    if (!state.editingUser) {
      throw new Error("Não foi possível identificar o usuário em edição");
    }
    await apiRequest(
      `/auth/admin/usuarios/${encodeURIComponent(state.editingUser)}`,
      "PATCH",
      { username, perfil, status }
    );
    setUsuarioMessage("");
    log("Usuário atualizado por gestor/admin", { usernameAnterior: state.editingUser, usernameNovo: username, perfil, status });
  } else {
    const response = await apiRequest("/auth/admin/usuarios", "POST", { username, perfil, status });
    setUsuarioMessage("");
    log("Usuário criado por gestor/admin", { username: response.username, perfil: response.perfil, status: response.status });
    await showConfirmDialog({
      title: "Senha temporária",
      message: "",
      centered: true,
      secretValue: response.senhaTemporaria ?? "-",
      footnote: "Essa senha será exibida somente nesta vez.",
      confirmText: "OK",
      showCancel: false
    });
  }

  clearUserForm();
  setUserFormMode("view");
  await refreshUsuarios();
}

function logout() {
  stopAutoSync();
  state.auth = null;
  state.pendingAuth = null;
  state.userFilter = "";
  showLoginView();
  hideForceChangeBox();
  el("currentUser").value = "";
  el("currentRole").value = "";
  el("baseUrl").value = "";
  el("loginPassword").value = "";
  el("profileUserName").textContent = "user";
  el("profileRoleName").textContent = getRoleDisplayName("OPERATOR");
  clearUserForm();
  setUserFormMode("view");
  if (el("uFiltroNome")) el("uFiltroNome").value = "";
  setUsuarioMessage("");
  clearFornecedorForm();
  setFornecedorFormMode("view");
  state.fornecedorFilter = "";
  if (el("fFiltroNome")) el("fFiltroNome").value = "";
  clearPromotorForm();
  setPromotorFormMode("view");
  state.promotorFilter = "";
  if (el("pFiltroNome")) el("pFiltroNome").value = "";
  updateProfileInitials("U");
  applyProfileToUI();
  setLoginMessage("");
}

function getRoleDisplayName(role) {
  if (role === "VIEWER") return "Visualizar";
  if (role === "OPERATOR") return "Prevenção";
  if (role === "GESTOR") return "Gestor";
  if (role === "ADMIN") return "Admin";
  return role || "";
}

function bindActions() {
  const triggerLogin = () => {
    login().catch((e) => {
      if (e.message === "Digite Usuário e Senha") {
        setLoginMessage(e.message);
        return;
      }
      if (e.status === 401) {
        setLoginMessage("Usuário/senha inválido");
        log("Falha no login", { status: e.status, error: e.message });
        return;
      }
      if (String(e.message || "").toLowerCase().includes("failed to fetch")) {
        setLoginMessage("Erro no servidor. Verifique se o sistema está online.");
        log("Falha no login", { error: e.message });
        return;
      }
      setLoginMessage(`Falha no login: ${e.message}`);
      log("Falha no login", { error: e.message });
    });
  };

  el("btnOpenProfile").addEventListener("click", () => activateTab("tab-perfil"));
  el("btnLogin").addEventListener("click", triggerLogin);
  el("btnForgotPassword").addEventListener("click", async () => {
    await showConfirmDialog({
      title: "Recuperação de senha",
      message: "Contate o administrador do sistema",
      confirmText: "OK",
      showCancel: false
    });
  });
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
      log("Falha troca obrigatória de senha", { error: e.message });
    });
  });

  el("btnLogout").addEventListener("click", logout);
  el("btnRefreshDashboard").addEventListener("click", () => refreshDashboard().catch((e) => log("Falha dashboard", { error: e.message })));
  el("btnRefreshUsuarios").addEventListener("click", () => refreshUsuarios().catch((e) => log("Falha usuários", { error: e.message })));
  el("btnSalvarFornecedor").addEventListener("click", () => {
    criarFornecedor().catch((e) => {
      setFornecedorMessage(e.message, true);
      log("Falha ao salvar fornecedor", { error: e.message });
    });
  });
  el("btnNovoFornecedor").addEventListener("click", () => {
    clearFornecedorForm();
    setFornecedorFormMode("new");
    setFornecedorMessage("Preencha os campos e clique em Salvar.");
  });
  el("btnCancelarFornecedor").addEventListener("click", async () => {
    const confirmar = await showConfirmDialog({
      title: "Cancelar operação",
      message: "Deseja cancelar a operação de fornecedor?"
    });
    if (!confirmar) return;
    clearFornecedorForm();
    setFornecedorFormMode("view");
    setFornecedorMessage("");
  });
  el("btnRefreshFornecedores").addEventListener("click", () => {
    refreshData().catch((e) => log("Falha fornecedores", { error: e.message }));
  });
  el("fFiltroNome").addEventListener("input", () => {
    state.fornecedorFilter = el("fFiltroNome").value || "";
    renderFornecedores(state.fornecedores);
  });
  el("fNome").addEventListener("input", () => {
    if (el("fNome").value.trim()) {
      setFornecedorFieldError("fNome", false);
      if (el("fMessage").classList.contains("is-error")) {
        setFornecedorMessage("");
      }
    }
  });
  el("btnSalvarPromotor").addEventListener("click", () => {
    criarPromotor().catch((e) => {
      setPromotorMessage(e.message, true);
      log("Falha ao salvar promotor", { error: e.message });
    });
  });
  el("btnNovoPromotor").addEventListener("click", () => {
    clearPromotorForm();
    setPromotorFormMode("new");
    setPromotorMessage("Preencha os campos e clique em Salvar.");
  });
  el("btnCancelarPromotor").addEventListener("click", async () => {
    const confirmar = await showConfirmDialog({
      title: "Cancelar operação",
      message: "Deseja cancelar a operação de promotor?"
    });
    if (!confirmar) return;
    clearPromotorForm();
    setPromotorFormMode("view");
    setPromotorMessage("");
  });
  el("btnRefreshPromotores").addEventListener("click", () => {
    refreshData().catch((e) => log("Falha promotores", { error: e.message }));
  });
  el("pFornecedorSearch").addEventListener("input", () => resolveCadastroFornecedorFromSearch(false));
  el("pFornecedorSearch").addEventListener("change", () => resolveCadastroFornecedorFromSearch(true));
  el("pFornecedorSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resolveCadastroFornecedorFromSearch(true);
  });
  el("btnFindFornecedor").addEventListener("click", () => resolveCadastroFornecedorFromSearch(true));
  el("pFiltroNome").addEventListener("input", () => {
    state.promotorFilter = el("pFiltroNome").value || "";
    renderPromotores(state.promotores);
  });
  el("pNome").addEventListener("input", () => {
    if (el("pNome").value.trim()) {
      setPromotorFieldError("pNome", false);
      if (el("pMessage").classList.contains("is-error")) {
        setPromotorMessage("");
      }
    }
  });
  el("pFornecedorSearch").addEventListener("input", () => {
    if (el("pFornecedorSearch").value.trim()) {
      setPromotorFieldError("pFornecedorSearch", false);
    }
  });
  el("btnRegistrarEntrada").addEventListener("click", () => {
    registrarEntrada().catch((e) => {
      setMovimentoMessage(`Falha ao registrar entrada: ${e.message}`);
      log("Falha ao registrar entrada", { error: e.message });
    });
  });
  el("btnRegistrarSaida").addEventListener("click", () => {
    registrarSaida().catch((e) => {
      setMovimentoMessage(`Falha ao registrar saída: ${e.message}`);
      log("Falha ao registrar saída", { error: e.message });
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
      setSaidaModalMessage(`Falha ao registrar saída: ${e.message}`);
      log("Falha ao salvar saída pelo modal", { error: e.message });
    });
  });
  el("saidaModal").addEventListener("click", (event) => {
    if (event.target !== el("saidaModal")) return;
    closeSaidaModal();
  });
  el("btnConfirmModalCancel").addEventListener("click", () => resolveConfirmDialog(false));
  el("btnConfirmModalOk").addEventListener("click", () => resolveConfirmDialog(true));
  el("confirmModalSecret").addEventListener("focus", () => el("confirmModalSecret").select());
  el("confirmModalSecret").addEventListener("click", () => el("confirmModalSecret").select());
  el("confirmModal").addEventListener("click", (event) => {
    if (event.target !== el("confirmModal")) return;
    resolveConfirmDialog(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!el("confirmModal").classList.contains("is-hidden")) {
      resolveConfirmDialog(false);
      return;
    }
    if (el("saidaModal").classList.contains("is-hidden")) return;
    closeSaidaModal();
  });
  el("btnNovoUsuario").addEventListener("click", () => {
    clearUserForm();
    setUserFormMode("new");
    setUsuarioMessage("Preencha os campos e clique em Salvar.");
  });
  el("btnCancelarUsuario").addEventListener("click", async () => {
    const confirmar = await showConfirmDialog({
      title: "Cancelar operação",
      message: "Deseja cancelar a operação de usuário?"
    });
    if (!confirmar) return;
    clearUserForm();
    setUserFormMode("view");
    setUsuarioMessage("");
  });
  el("btnSalvarUsuario").addEventListener("click", () => {
    criarUsuario().catch((e) => {
      setUsuarioMessage(e.message, true);
      log("Falha ao salvar usuário", { error: e.message });
    });
  });
  el("btnResetSenha").addEventListener("click", () => {
    resetarSenhaUsuario().catch((e) => {
      setUsuarioMessage(e.message);
      log("Falha reset de senha", { error: e.message });
    });
  });
  el("uFiltroNome").addEventListener("input", () => {
    state.userFilter = el("uFiltroNome").value || "";
    renderUsuarios(state.usuarios);
  });
  el("uUsername").addEventListener("input", () => {
    if (el("uUsername").value.trim()) {
      setUserFieldError("uUsername", false);
      if (el("uMessage").classList.contains("is-error")) {
        setUsuarioMessage("");
      }
    }
  });
  el("btnSaveProfile").addEventListener("click", saveProfileFromForm);
  el("btnRemoveProfileAvatar").addEventListener("click", () => {
    removerFotoPerfil().catch((e) => log("Falha ao remover foto de perfil", { error: e.message }));
  });

}

bindActions();
bindProfileAvatar();
setupTabs();
initDashboardDefaults();
clearUserForm();
setUserFormMode("view");
clearFornecedorForm();
setFornecedorFormMode("view");
clearPromotorForm();
setPromotorFormMode("view");
loadSavedLogin();
showLoginView();

