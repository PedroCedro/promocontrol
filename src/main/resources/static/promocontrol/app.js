const state = {
  fornecedores: [],
  promotores: [],
  usuarios: [],
  dashboard: null,
  operacaoResumo: null,
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
  ajusteHorarioModalContext: null,
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
  promotorFilter: "",
  lookupModalType: "",
  lookupModalResults: [],
  lookupModalSelectedId: "",
  configuracaoEmpresaAtual: null,
  operacaoMovimentosMap: new Map(),
  empresasCadastro: [],
  operacaoFilter: ""
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

function setupConfiguracoesTabs() {
  const tabs = document.querySelectorAll(".config-subtab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateConfiguracoesTab(tab.dataset.configTab);
    });
  });
}

function resolveCadastroEmEdicaoAoNavegar(activeTabId, targetTabId) {
  if (activeTabId === targetTabId) return null;
  if (state.promotorFormMode !== "view" && activeTabId === "tab-promotores") {
    return {
      setter: setPromotorMessage,
      message: "Finalize ou cancele o cadastro de promotor antes de mudar de menu."
    };
  }
  if (state.fornecedorFormMode !== "view" && activeTabId === "tab-fornecedores") {
    return {
      setter: setFornecedorMessage,
      message: "Finalize ou cancele o cadastro de fornecedor antes de mudar de menu."
    };
  }
  if (state.userFormMode !== "view" && !el("adminUsersCard")?.classList.contains("is-hidden")) {
    return {
      setter: setUsuarioMessage,
      message: "Finalize ou cancele o cadastro de usuário antes de mudar de menu."
    };
  }
  return null;
}

function activateTab(tabId) {
  const activePanel = document.querySelector(".tab-panel.is-active");
  const activeTabId = activePanel?.id || "";
  const cadastroEmEdicao = resolveCadastroEmEdicaoAoNavegar(activeTabId, tabId);
  if (cadastroEmEdicao) {
    cadastroEmEdicao.setter(cadastroEmEdicao.message, true);
    return;
  }

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

function activateConfiguracoesTab(tabId) {
  const tabs = document.querySelectorAll(".config-subtab-btn");
  const panels = document.querySelectorAll(".config-subtab-panel");
  tabs.forEach((t) => t.classList.remove("is-active"));
  panels.forEach((p) => p.classList.remove("is-active"));

  const targetButton = Array.from(tabs).find((t) => t.dataset.configTab === tabId);
  if (targetButton) {
    targetButton.classList.add("is-active");
  }

  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add("is-active");
}

function initDashboardDefaults() {
  const today = currentLocalDateISO();
  if (!el("dashData").value) {
    el("dashData").value = today;
  }
  if (el("mDataOperacao")) {
    el("mDataOperacao").value = today;
  }
  atualizarIndicadorModoOperacao();
}

function currentLocalDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function operacaoDataSelecionadaISO() {
  const value = String(el("mDataOperacao")?.value || "").slice(0, 10);
  return value || currentLocalDateISO();
}

function podeMovimentarNaDataSelecionada() {
  return operacaoDataSelecionadaISO() === currentLocalDateISO();
}

function validarMovimentacaoNaDataSelecionada() {
  if (podeMovimentarNaDataSelecionada()) return;
  throw new Error("Movimentação permitida somente na data atual. Ajuste a data da operação para hoje.");
}

function atualizarIndicadorModoOperacao() {
  const badge = el("mModoOperacaoBadge");
  if (!badge) return;
  const historico = !podeMovimentarNaDataSelecionada();
  badge.classList.toggle("is-historico", historico);
  badge.textContent = historico
    ? "Modo consulta histórica (somente leitura)"
    : "Modo operacional de hoje";
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

function setConfiguracaoMessage(message, isError = false) {
  const field = el("cfgMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function setEmpresaContratanteModalMessage(message, isError = false) {
  const field = el("empresaContratanteModalMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function closeInlinePanels() {
  el("pFornecedorInlinePanel")?.classList.add("is-hidden");
  el("mPromotorInlinePanel")?.classList.add("is-hidden");
}

function renderInlineList(listId, items, labelBuilder, onSelect) {
  const list = el(listId);
  if (!list) return;
  list.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "inline-picker-item";
    empty.textContent = "Nenhum resultado encontrado.";
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "inline-picker-item";
    li.textContent = labelBuilder(item);
    li.addEventListener("click", () => onSelect(item));
    list.appendChild(li);
  });
}

function openFornecedorInlinePanel() {
  const panel = el("pFornecedorInlinePanel");
  if (!panel) return;
  const typed = el("pFornecedorSearch")?.value?.trim() || "";
  const items = typed ? findFornecedoresByQuery(typed) : listCadastroFornecedores();
  renderInlineList(
    "pFornecedorInlineList",
    items,
    (fornecedor) => buildFornecedorSearchLabel(fornecedor),
    (fornecedor) => {
      applyCadastroFornecedorSelection(fornecedor);
      panel.classList.add("is-hidden");
      setPromotorMessage("");
    }
  );
  panel.classList.remove("is-hidden");
}

function openPromotorInlinePanel() {
  const panel = el("mPromotorInlinePanel");
  if (!panel) return;
  const typed = el("mPromotorSearch")?.value?.trim() || "";
  const items = typed ? findPromotoresByQuery(typed) : listMovimentoPromotoresAtivos();
  renderInlineList(
    "mPromotorInlineList",
    items,
    (promotor) => buildPromotorSearchLabel(promotor),
    (promotor) => {
      applyMovimentoPromotorSelection(promotor);
      panel.classList.add("is-hidden");
      setMovimentoMessage("");
    }
  );
  panel.classList.remove("is-hidden");
}

function setLookupModalMessage(message, isError = false) {
  const field = el("lookupModalMessage");
  if (!field) return;
  field.textContent = message || "";
  field.classList.toggle("is-error", Boolean(message) && isError);
}

function renderLookupModalResults() {
  const list = el("lookupResults");
  if (!list) return;
  list.innerHTML = "";

  if (!state.lookupModalResults.length) {
    const li = document.createElement("li");
    li.className = "inline-picker-item";
    li.textContent = "Nenhum resultado encontrado.";
    list.appendChild(li);
    return;
  }

  state.lookupModalResults.forEach((item) => {
    const li = document.createElement("li");
    li.className = "inline-picker-item";
    const isFornecedor = state.lookupModalType === "fornecedor";
    li.textContent = isFornecedor
      ? buildFornecedorSearchLabel(item)
      : buildPromotorSearchLabel(item);
    if (String(item.id) === String(state.lookupModalSelectedId)) {
      li.classList.add("is-active");
    }
    li.addEventListener("click", () => {
      state.lookupModalSelectedId = String(item.id);
      renderLookupModalResults();
    });
    list.appendChild(li);
  });
}

function runLookupModalSearch() {
  const typedId = (el("lookupId")?.value || "").trim();
  const typedNome = (el("lookupNome")?.value || "").trim();
  const query = `${typedId} ${typedNome}`.trim();

  state.lookupModalResults = state.lookupModalType === "fornecedor"
    ? (query ? findFornecedoresByQuery(query) : listCadastroFornecedores())
    : (query ? findPromotoresByQuery(query) : listMovimentoPromotoresAtivos());

  state.lookupModalSelectedId = state.lookupModalResults.length === 1
    ? String(state.lookupModalResults[0].id)
    : "";

  renderLookupModalResults();

  if (!state.lookupModalResults.length) {
    setLookupModalMessage("Nenhum resultado encontrado para os filtros informados.", true);
    return;
  }
  setLookupModalMessage(`${state.lookupModalResults.length} resultado(s) encontrado(s).`);
}

function openLookupModal(type) {
  state.lookupModalType = type;
  state.lookupModalResults = [];
  state.lookupModalSelectedId = "";

  const isFornecedor = type === "fornecedor";
  el("lookupModalTitle").textContent = isFornecedor ? "Localizar Fornecedor" : "Localizar Promotor";
  el("lookupNameLabelText").textContent = isFornecedor ? "Fornecedor" : "Promotor";
  el("lookupId").value = "";
  el("lookupNome").value = "";
  el("lookupNome").placeholder = isFornecedor ? "Digite o fornecedor" : "Digite o promotor";
  setLookupModalMessage("");
  renderLookupModalResults();
  el("lookupModal").classList.remove("is-hidden");
  el("lookupModal").setAttribute("aria-hidden", "false");
  el("lookupNome").focus();
}

function closeLookupModal() {
  el("lookupModal").classList.add("is-hidden");
  el("lookupModal").setAttribute("aria-hidden", "true");
  state.lookupModalType = "";
  state.lookupModalResults = [];
  state.lookupModalSelectedId = "";
}

function confirmLookupModalSelection() {
  if (!state.lookupModalSelectedId) {
    setLookupModalMessage("Selecione um item da lista para continuar.", true);
    return;
  }

  if (state.lookupModalType === "fornecedor") {
    const fornecedor = listCadastroFornecedores()
      .find((f) => String(f.id) === String(state.lookupModalSelectedId));
    if (fornecedor) {
      applyCadastroFornecedorSelection(fornecedor);
      setPromotorMessage("");
    }
  } else if (state.lookupModalType === "promotor") {
    const promotor = listMovimentoPromotoresAtivos()
      .find((p) => String(p.id) === String(state.lookupModalSelectedId));
    if (promotor) {
      applyMovimentoPromotorSelection(promotor);
      setMovimentoMessage("");
    }
  }
  closeLookupModal();
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

function normalizeCnpj(cnpj) {
  return String(cnpj ?? "").replace(/\D/g, "");
}

function openEmpresaContratanteModal() {
  if (!state.auth?.canManageCatalog) return;
  el("ecCnpj").value = "";
  el("ecRazaoSocial").value = "";
  el("ecNomeFantasia").value = "";
  el("ecEmail").value = "";
  el("ecTelefone").value = "";
  el("ecUf").value = "";
  setEmpresaContratanteModalMessage("");
  el("empresaContratanteModal").classList.remove("is-hidden");
  el("empresaContratanteModal").setAttribute("aria-hidden", "false");
  el("ecCnpj").focus();
}

function closeEmpresaContratanteModal() {
  setEmpresaContratanteModalMessage("");
  el("empresaContratanteModal").classList.add("is-hidden");
  el("empresaContratanteModal").setAttribute("aria-hidden", "true");
}

async function consultarCnpjEmpresaContratante() {
  const cnpj = normalizeCnpj(el("ecCnpj").value);
  if (!cnpj || cnpj.length !== 14) {
    setEmpresaContratanteModalMessage("Informe um CNPJ válido com 14 dígitos.", true);
    return;
  }

  setEmpresaContratanteModalMessage("Consultando CNPJ...");
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (!response.ok) {
    throw new Error("Não foi possível consultar esse CNPJ agora.");
  }
  const data = await response.json();
  el("ecRazaoSocial").value = data.razao_social || "";
  el("ecNomeFantasia").value = data.nome_fantasia || "";
  el("ecEmail").value = data.email || "";
  el("ecTelefone").value = data.ddd_telefone_1 || "";
  el("ecUf").value = data.uf || "";
  setEmpresaContratanteModalMessage("Dados preenchidos pela base nacional.");
}

function abrirConsultaCnpjExterna() {
  const cnpj = normalizeCnpj(el("ecCnpj").value);
  const url = cnpj
    ? `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
    : "https://brasilapi.com.br/docs#tag/CNPJ";
  window.open(url, "_blank", "noopener,noreferrer");
}

async function salvarEmpresaContratanteModal() {
  if (!state.auth?.canManageCatalog) {
    throw new Error("Sem permissão para cadastrar empresa contratante.");
  }

  const cnpj = normalizeCnpj(el("ecCnpj").value);
  const razaoSocial = String(el("ecRazaoSocial").value || "").trim();
  const nomeFantasia = String(el("ecNomeFantasia").value || "").trim();
  const email = String(el("ecEmail").value || "").trim();
  const telefone = String(el("ecTelefone").value || "").trim();
  const uf = String(el("ecUf").value || "").trim().toUpperCase();
  const nomeEmpresa = nomeFantasia || razaoSocial;

  if (!nomeEmpresa) {
    setEmpresaContratanteModalMessage("Informe Razão Social ou Nome Fantasia.", true);
    return;
  }

  const created = await apiRequest("/fornecedores", "POST", {
    nome: nomeEmpresa,
    ativo: true
  });
  const createdEmpresa = await apiRequest("/empresas-cadastro", "POST", {
    nome: nomeEmpresa,
    cnpj: cnpj || null,
    email: email || null,
    telefone: telefone || null,
    uf: uf || null,
    ativo: true,
    fornecedorId: created.id
  });

  log("Empresa contratante cadastrada", {
    id: createdEmpresa?.id ?? null,
    nome: nomeEmpresa,
    fornecedorId: created?.id ?? null,
    cnpj,
    razaoSocial,
    nomeFantasia,
    email,
    telefone,
    uf
  });

  await refreshData();
  if (createdEmpresa?.id != null && el("cfgEmpresaId")) {
    el("cfgEmpresaId").value = String(createdEmpresa.id);
    await carregarConfiguracaoEmpresaSelecionada();
  }

  setEmpresaContratanteModalMessage("Salvo com sucesso.");
  await showConfirmDialog({
    title: "Cadastro de Empresa",
    message: "Empresa contratante salva com sucesso.",
    confirmText: "OK",
    showCancel: false
  });
  closeEmpresaContratanteModal();
  setConfiguracaoMessage("Empresa contratante cadastrada e selecionada.");
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

function openUserModal() {
  if (!state.auth?.canManageUsers) return;
  el("adminUsersCard").classList.remove("is-hidden");
  el("adminUsersCard").setAttribute("aria-hidden", "false");
  el("uUsername").focus();
}

function closeUserModal() {
  el("adminUsersCard").classList.add("is-hidden");
  el("adminUsersCard").setAttribute("aria-hidden", "true");
}

function cancelUserEdition() {
  clearUserForm();
  setUserFormMode("view");
  setUsuarioMessage("");
  closeUserModal();
}

function setUserFormMode(mode) {
  state.userFormMode = mode;
  const isView = mode === "view";
  const isEdit = mode === "edit";

  el("uUsername").disabled = isView;
  el("uPerfil").disabled = isView;
  el("uStatus").disabled = !isEdit;
  el("uAcessaWeb").disabled = isView;
  el("uAcessaMobile").disabled = isView;
  el("btnNovoUsuario").disabled = !isView;
  el("btnCancelarUsuario").disabled = isView;
  el("btnSalvarUsuario").disabled = isView;
  el("btnResetSenha").disabled = !isEdit;
  el("btnResetSenha").classList.toggle("is-hidden", !isEdit);
  el("uEditModeBadge").classList.toggle("is-hidden", !isEdit);

  if (mode === "new") {
    el("uStatus").value = "ATIVO";
    el("uAcessaWeb").value = "true";
    el("uAcessaMobile").value = "false";
  }
}

function clearUserForm() {
  state.editingUser = null;
  el("uCodigo").value = "";
  el("uUsername").value = "";
  el("uPerfil").value = "VIEWER";
  el("uStatus").value = "ATIVO";
  el("uAcessaWeb").value = "true";
  el("uAcessaMobile").value = "false";
  setUserFieldError("uUsername", false);
}

function fillUserFormForEdit(user) {
  state.editingUser = user.username;
  el("uCodigo").value = formatCodigo(user.codigo);
  el("uUsername").value = user.username ?? "";
  el("uPerfil").value = user.perfil ?? "VIEWER";
  el("uStatus").value = user.status ?? "ATIVO";
  el("uAcessaWeb").value = String(user.acessaWeb !== false);
  el("uAcessaMobile").value = String(Boolean(user.acessaMobile));
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
  closeInlinePanels();
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
  const defaultTabForUser = state.auth?.role === "OPERATOR"
    ? "tab-movimentos"
    : "tab-dashboard";
  const dashboardTabButton = document.querySelector('.tab-btn[data-tab="tab-dashboard"]');
  const hideDashboardForOperator = state.auth?.role === "OPERATOR";

  el("baseUrl").value = state.auth.baseUrl;
  el("currentUser").value = state.auth.username;
  el("currentRole").value = state.auth.role;
  el("profileUserName").textContent = state.auth.username;
  el("profileRoleName").textContent = getRoleDisplayName(state.auth.role);
  updateProfileInitials(state.auth.username);
  applyProfileToUI();
  el("tabUsersBtn").classList.toggle("is-hidden", !state.auth.canManageUsers);
  el("tabConfiguracoesBtn").classList.toggle("is-hidden", !state.auth.canManageCatalog);
  el("tabMovimentosBtn").classList.toggle("is-hidden", !state.auth.canOperate);
  el("cfgSubtabLogsBtn").classList.toggle("is-hidden", !state.auth.isAdmin);
  if (dashboardTabButton) {
    dashboardTabButton.classList.toggle("is-hidden", hideDashboardForOperator);
  }
  el("tab-dashboard").classList.toggle("is-hidden", hideDashboardForOperator);
  el("tab-configuracoes").classList.toggle("is-hidden", !state.auth.canManageCatalog);
  closeUserModal();
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
    activateTab(defaultTabForUser);
  }
  if (!state.auth.canOperate && el("tab-movimentos").classList.contains("is-active")) {
    activateTab(defaultTabForUser);
  }
  if (!state.auth.canManageUsers && el("tab-usuarios").classList.contains("is-active")) {
    activateTab(defaultTabForUser);
  }
  if (!state.auth.canManageCatalog && el("tab-configuracoes").classList.contains("is-active")) {
    activateTab(defaultTabForUser);
  }
  if (hideDashboardForOperator && el("tab-dashboard").classList.contains("is-active")) {
    activateTab("tab-movimentos");
  }
  if (!state.auth.isAdmin && el("config-tab-logs").classList.contains("is-active")) {
    activateConfiguracoesTab("config-tab-gerais");
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
    const actionButtons = state.auth?.canManageCatalog
      ? `<button class="btn-table-small promotor-edit-btn" type="button" data-id="${p.id}">Editar</button>${state.auth?.isAdmin ? ` <button class="btn-table-small btn-table-delete promotor-delete-btn" type="button" data-id="${p.id}" data-nome="${p.nome ?? ""}">Excluir</button>` : ""}`
      : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatCodigo(p.codigo)}</td>
      <td>${p.nome ?? ""}</td>
      <td>${formatCodigo(p.fornecedorCodigo)} - ${p.fornecedorNome ?? ""}</td>
      <td><span class="${statusClass}">${status || "-"}</span></td>
      <td>${p.telefone ?? ""}</td>
      <td>${actionButtons}</td>`;
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

  tbody.querySelectorAll(".promotor-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.dataset.id || "");
      if (!id) return;
      const nome = String(btn.dataset.nome || "");
      excluirPromotor(id, nome).catch((e) => {
        setPromotorMessage(e.message, true);
        log("Falha ao excluir promotor", { error: e.message, id, nome });
      });
    });
  });
}

function renderFornecedores(list) {
  const table = el("tblFornecedores");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  const termo = normalizeText(state.fornecedorFilter || "");
  const fornecedorEmpresasIds = new Set(
    (state.empresasCadastro ?? []).map((e) => String(e.fornecedorId))
  );
  const filtrados = list
    .filter((f) => !isFornecedorSistema(f?.nome))
    .filter((f) => !fornecedorEmpresasIds.has(String(f.id)))
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
      ? `<button class="btn-table-small fornecedor-edit-btn" type="button" data-id="${f.id}">Editar</button>${state.auth?.isAdmin ? ` <button class="btn-table-small btn-table-delete fornecedor-delete-btn" type="button" data-id="${f.id}" data-nome="${f.nome ?? ""}">Excluir</button>` : ""}`
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

  tbody.querySelectorAll(".fornecedor-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      if (Number.isNaN(id)) return;
      const nome = String(btn.dataset.nome || "");
      excluirFornecedor(id, nome).catch((e) => {
        setFornecedorMessage(e.message, true);
        log("Falha ao excluir fornecedor", { error: e.message, id, nome });
      });
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
      const acessaWeb = normalizeText(u.acessaWeb ? "WEB" : "");
      const acessaMobile = normalizeText(u.acessaMobile ? "MOBILE" : "");
      return codigo.includes(termo)
        || username.includes(termo)
        || perfil.includes(termo)
        || perfilLabel.includes(termo)
        || status.includes(termo)
        || acessaWeb.includes(termo)
        || acessaMobile.includes(termo);
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
      <td>${u.acessaWeb ? "SIM" : "NÃO"}</td>
      <td>${u.acessaMobile ? "SIM" : "NÃO"}</td>
      <td>${u.precisaTrocarSenha ? "SIM" : "NÃO"}</td>
      <td><button class="btn-table-small user-edit-btn" type="button" data-username="${u.username ?? ""}" data-perfil="${u.perfil ?? ""}">Editar</button>${state.auth?.isAdmin && String(u.username || "").toLowerCase() !== String(state.auth?.username || "").toLowerCase()
        ? ` <button class="btn-table-small btn-table-delete user-delete-btn" type="button" data-username="${u.username ?? ""}">Excluir</button>`
        : ""}</td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".user-edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const username = String(btn.dataset.username || "").trim();
      if (!username) return;
      const user = state.usuarios.find((u) => String(u.username) === username);
      if (!user) return;
      fillUserFormForEdit(user);
      setUserFormMode("edit");
      setUsuarioMessage("");
      openUserModal();
    });
  });

  tbody.querySelectorAll(".user-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const username = String(btn.dataset.username || "").trim();
      if (!username) return;
      excluirUsuario(username).catch((e) => {
        setUsuarioMessage(e.message, true);
        log("Falha ao excluir usuário", { error: e.message, username });
      });
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
    const detalhe = resolveLinhaDetalhe(linha, state.dashboardMovimentosMap);
    const saidaCell = linha.saidaEm
      ? formatHoraMinuto(linha.saidaEm)
      : "-";
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
          ${state.auth?.isAdmin ? `
          <div class="detail-actions">
            ${detalhe.entradaId ? `<button class="btn-table-small adjust-mov-btn" type="button" data-movimento-id="${detalhe.entradaId}" data-tipo="ENTRADA" data-promotor="${linha.promotorNome ?? ""}" data-data-hora="${linha.entradaEm ?? ""}">Ajustar Entrada</button>` : ""}
            ${detalhe.saidaId ? `<button class="btn-table-small adjust-mov-btn" type="button" data-movimento-id="${detalhe.saidaId}" data-tipo="SAIDA" data-promotor="${linha.promotorNome ?? ""}" data-data-hora="${linha.saidaEm ?? ""}">Ajustar Saída</button>` : ""}
          </div>` : ""}
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

  tbody.querySelectorAll(".adjust-mov-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const movimentoId = String(btn.dataset.movimentoId || "");
      if (!movimentoId) return;
      const tipo = String(btn.dataset.tipo || "MOVIMENTO");
      const promotorNome = String(btn.dataset.promotor || "");
      const dataHoraAtual = String(btn.dataset.dataHora || "");
      openAjusteHorarioModal({ movimentoId, tipo, promotorNome, dataHoraAtual });
    });
  });

}

function renderOperacaoDia(resumo) {
  const table = el("tblOperacaoDia");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  const podeMovimentar = podeMovimentarNaDataSelecionada();

  const filtro = String(state.operacaoFilter || "").trim().toLowerCase();
  const linhas = (resumo?.linhas ?? []).filter((linha) => {
    if (!filtro) return true;
    const codigo = formatCodigo(linha.promotorCodigo);
    const haystack = [
      codigo,
      linha.promotorNome,
      linha.fornecedorNome,
      linha.usuarioEntrada,
      linha.usuarioSaida,
      linha.liberadoPor
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(filtro);
  });
  linhas.forEach((linha, index) => {
    const detalhe = resolveLinhaDetalhe(linha, state.operacaoMovimentosMap);
    const saidaCell = linha.saidaEm
      ? formatHoraMinuto(linha.saidaEm)
      : (podeMovimentar
        ? `<button class="quick-saida-btn operacao-saida-btn" data-line-index="${index}" type="button" title="Registrar saída">&gt;</button>`
        : "-");
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
          ${state.auth?.isAdmin && podeMovimentar ? `
          <div class="detail-actions">
            ${detalhe.entradaId ? `<button class="btn-table-small adjust-mov-btn" type="button" data-movimento-id="${detalhe.entradaId}" data-tipo="ENTRADA" data-promotor="${linha.promotorNome ?? ""}" data-data-hora="${linha.entradaEm ?? ""}">Ajustar Entrada</button>` : ""}
            ${detalhe.saidaId ? `<button class="btn-table-small adjust-mov-btn" type="button" data-movimento-id="${detalhe.saidaId}" data-tipo="SAIDA" data-promotor="${linha.promotorNome ?? ""}" data-data-hora="${linha.saidaEm ?? ""}">Ajustar Saída</button>` : ""}
            ${detalhe.entradaId ? `<button class="btn-table-small btn-table-delete op-delete-mov-btn" type="button" data-movimento-id="${detalhe.entradaId}" data-tipo="ENTRADA" data-promotor="${linha.promotorNome ?? ""}">Excluir Entrada</button>` : ""}
            ${detalhe.saidaId ? `<button class="btn-table-small btn-table-delete op-delete-mov-btn" type="button" data-movimento-id="${detalhe.saidaId}" data-tipo="SAIDA" data-promotor="${linha.promotorNome ?? ""}">Excluir Saída</button>` : ""}
          </div>` : ""}
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

  tbody.querySelectorAll(".adjust-mov-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const movimentoId = String(btn.dataset.movimentoId || "");
      if (!movimentoId) return;
      const tipo = String(btn.dataset.tipo || "MOVIMENTO");
      const promotorNome = String(btn.dataset.promotor || "");
      const dataHoraAtual = String(btn.dataset.dataHora || "");
      openAjusteHorarioModal({ movimentoId, tipo, promotorNome, dataHoraAtual });
    });
  });

  tbody.querySelectorAll(".op-delete-mov-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const movimentoId = String(btn.dataset.movimentoId || "");
      if (!movimentoId) return;
      const tipo = String(btn.dataset.tipo || "MOVIMENTO");
      const promotorNome = String(btn.dataset.promotor || "");
      excluirMovimento(movimentoId, tipo, promotorNome).catch((e) => {
        setMovimentoMessage(`Falha ao excluir movimento: ${e.message}`);
        log("Falha ao excluir movimento", { error: e.message, movimentoId, tipo, promotorNome });
      });
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

function resolveLinhaDetalhe(linha, movimentosMap = state.dashboardMovimentosMap) {
  const promotorKey = String(linha.promotorId ?? "");
  const movimentos = movimentosMap.get(promotorKey) ?? [];
  const entradaKey = normalizeDateTimeKey(linha.entradaEm);
  const saidaKey = normalizeDateTimeKey(linha.saidaEm);

  const entrada = movimentos.find((m) =>
    m.tipo === "ENTRADA" && normalizeDateTimeKey(m.dataHora) === entradaKey);
  const saida = movimentos.find((m) =>
    m.tipo === "SAIDA" && normalizeDateTimeKey(m.dataHora) === saidaKey);

  return {
    entradaId: entrada?.id ?? "",
    saidaId: saida?.id ?? "",
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
  const fornecedorHidden = el("pFornecedorId");
  const dashSelect = el("dashFornecedorId");
  if (!fornecedorSearch || !fornecedorHidden || !dashSelect) return;

  dashSelect.innerHTML = "<option value=\"\">Todos</option>";
  state.cadastroFornecedorLookup = new Map();

  state.fornecedores
    .filter((f) => !isFornecedorSistema(f?.nome))
    .filter((f) => !new Set((state.empresasCadastro ?? []).map((e) => String(e.fornecedorId))).has(String(f.id)))
    .forEach((f) => {
    const label = buildFornecedorSearchLabel(f);
    state.cadastroFornecedorLookup.set(normalizeText(label), String(f.id));

    const optDash = document.createElement("option");
    optDash.value = f.id;
    optDash.textContent = `${formatCodigo(f.codigo)} - ${f.nome}`;
    dashSelect.appendChild(optDash);
  });

  const selectedFornecedor = state.fornecedores
    .filter((f) => !isFornecedorSistema(f?.nome))
    .filter((f) => !new Set((state.empresasCadastro ?? []).map((e) => String(e.fornecedorId))).has(String(f.id)))
    .find((f) => String(f.id) === String(fornecedorHidden.value));

  if (selectedFornecedor) {
    fornecedorSearch.value = buildFornecedorSearchLabel(selectedFornecedor);
  } else {
    fornecedorHidden.value = "";
    fornecedorSearch.value = "";
  }

  syncMovimentoPromotorSelect();
  syncConfiguracaoEmpresaSelect();
}

function syncConfiguracaoEmpresaSelect() {
  const select = el("cfgEmpresaId");
  if (!select) return;
  const previous = String(select.value || "");
  select.innerHTML = "<option value=\"\">Selecione</option>";

  const empresasContratantes = listEmpresasContratantes();
  empresasContratantes.forEach((empresa) => {
    const option = document.createElement("option");
    option.value = String(empresa.id);
    option.dataset.fornecedorId = String(empresa.fornecedorId);
    option.textContent = `${formatCodigo(empresa.codigo)} - ${empresa.nome ?? "Sem nome"}`;
    select.appendChild(option);
  });

  if (previous && Array.from(select.options).some((opt) => opt.value === previous)) {
    select.value = previous;
    return;
  }
  if (empresasContratantes.length) {
    select.value = String(empresasContratantes[0].id);
  }
}

function setConfiguracaoFormEnabled(enabled) {
  const ids = [
    "cfgEncerramentoAuto",
    "cfgHorarioEncerramento",
    "cfgTextoObservacao",
    "cfgPermitirMultiplas",
    "cfgExigirFoto",
    "btnSalvarConfigEmpresa",
    "btnResetConfigEmpresa"
  ];
  ids.forEach((id) => {
    if (el(id)) el(id).disabled = !enabled;
  });
}

function limparConfiguracaoForm() {
  state.configuracaoEmpresaAtual = null;
  if (el("cfgEncerramentoAuto")) el("cfgEncerramentoAuto").value = "false";
  if (el("cfgHorarioEncerramento")) el("cfgHorarioEncerramento").value = "";
  if (el("cfgTextoObservacao")) el("cfgTextoObservacao").value = "";
  if (el("cfgPermitirMultiplas")) el("cfgPermitirMultiplas").value = "true";
  if (el("cfgExigirFoto")) el("cfgExigirFoto").value = "false";
  atualizarRegrasCamposConfiguracao();
}

function preencherConfiguracaoForm(config) {
  state.configuracaoEmpresaAtual = config || null;
  if (!config) {
    limparConfiguracaoForm();
    return;
  }
  el("cfgEncerramentoAuto").value = String(Boolean(config.encerramentoAutomaticoHabilitado));
  el("cfgHorarioEncerramento").value = formatHoraMinuto(config.horarioEncerramentoAutomatico || "");
  el("cfgTextoObservacao").value = config.textoObservacaoEncerramentoAutomatico || "";
  el("cfgPermitirMultiplas").value = String(Boolean(config.permitirMultiplasEntradasNoDia));
  el("cfgExigirFoto").value = String(Boolean(config.exigirFotoNaEntrada));
  atualizarRegrasCamposConfiguracao();
}

function atualizarRegrasCamposConfiguracao() {
  const encerramentoHabilitado = el("cfgEncerramentoAuto")?.value === "true";
  const horarioField = el("cfgHorarioEncerramento");
  if (!horarioField) return;
  horarioField.disabled = !encerramentoHabilitado;
  horarioField.required = encerramentoHabilitado;
}

async function carregarConfiguracaoEmpresaSelecionada() {
  const fornecedorId = getFornecedorIdDaEmpresaSelecionada();
  if (!fornecedorId) {
    setConfiguracaoMessage("Selecione a empresa contratante para carregar a configuração.", true);
    setConfiguracaoFormEnabled(false);
    limparConfiguracaoForm();
    return;
  }

  const config = await apiRequest(`/empresas/${encodeURIComponent(fornecedorId)}/configuracao`);
  preencherConfiguracaoForm(config);
  setConfiguracaoFormEnabled(true);
  setConfiguracaoMessage("Configuração carregada.");
}

async function salvarConfiguracaoEmpresaSelecionada() {
  const fornecedorId = getFornecedorIdDaEmpresaSelecionada();
  if (!fornecedorId) {
    throw new Error("Selecione a empresa contratante para salvar a configuração.");
  }

  const encerramentoAutomaticoHabilitado = el("cfgEncerramentoAuto").value === "true";
  const horarioEncerramentoAutomatico = (el("cfgHorarioEncerramento").value || "").trim();
  if (encerramentoAutomaticoHabilitado && !horarioEncerramentoAutomatico) {
    throw new Error("Informe o horário quando o encerramento automático estiver habilitado.");
  }

  const payload = {
    encerramentoAutomaticoHabilitado,
    horarioEncerramentoAutomatico: horarioEncerramentoAutomatico || null,
    textoObservacaoEncerramentoAutomatico: (el("cfgTextoObservacao").value || "").trim(),
    permitirMultiplasEntradasNoDia: el("cfgPermitirMultiplas").value === "true",
    exigirFotoNaEntrada: el("cfgExigirFoto").value === "true"
  };

  const config = await apiRequest(`/empresas/${encodeURIComponent(fornecedorId)}/configuracao`, "PUT", payload);
  preencherConfiguracaoForm(config);
  setConfiguracaoMessage("Configuração salva com sucesso.");
  log("Configuração da empresa atualizada", { fornecedorId, payload });
}

async function restaurarConfiguracaoPadraoEmpresaSelecionada() {
  const fornecedorId = getFornecedorIdDaEmpresaSelecionada();
  if (!fornecedorId) {
    throw new Error("Selecione a empresa contratante para restaurar a configuração.");
  }

  const confirmar = await showConfirmDialog({
    title: "Restaurar padrão",
    message: "Deseja restaurar a configuração padrão desta empresa?"
  });
  if (!confirmar) return;

  const config = await apiRequest(`/empresas/${encodeURIComponent(fornecedorId)}/configuracao`, "DELETE");
  preencherConfiguracaoForm(config);
  setConfiguracaoMessage("Configuração padrão restaurada.");
  log("Configuração da empresa restaurada para padrão", { fornecedorId });
}

function isFornecedorSistema(nome) {
  const normalized = normalizeText(nome);
  return normalized === "fornecedor nao informado";
}

function syncMovimentoPromotorSelect() {
  const input = el("mPromotorSearch");
  const hiddenPromotorId = el("mPromotorId");
  if (!input || !hiddenPromotorId) return;
  const filtered = state.promotores.filter((p) => p.status === "ATIVO");
  state.movimentoPromotorLookup = new Map();

  filtered.forEach((p) => {
    const label = buildPromotorSearchLabel(p);
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

function clearMovimentoForm() {
  const promotorInput = el("mPromotorSearch");
  const promotorId = el("mPromotorId");
  const observacao = el("mObservacao");
  if (promotorInput) promotorInput.value = "";
  if (promotorId) promotorId.value = "";
  if (observacao) observacao.value = "";
  updateMovimentoFornecedorFromPromotor();
  closeInlinePanels();
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

function buildOperacaoDiaQuery() {
  const params = new URLSearchParams();
  const data = operacaoDataSelecionadaISO();
  if (data) params.set("data", data);
  const query = params.toString();
  return query ? `/dashboard/planilha-principal?${query}` : "/dashboard/planilha-principal";
}

function listCadastroFornecedores() {
  const fornecedorEmpresasIds = new Set(
    (state.empresasCadastro ?? []).map((e) => String(e.fornecedorId))
  );
  return state.fornecedores
    .filter((f) => !isFornecedorSistema(f?.nome))
    .filter((f) => !fornecedorEmpresasIds.has(String(f.id)));
}

function listEmpresasContratantes() {
  return (state.empresasCadastro ?? []).filter((e) => Boolean(e?.ativo));
}

function getFornecedorIdDaEmpresaSelecionada() {
  const select = el("cfgEmpresaId");
  if (!select) return "";
  const selectedOption = select.options[select.selectedIndex];
  return String(selectedOption?.dataset?.fornecedorId || "").trim();
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
  atualizarIndicadorModoOperacao();
  state.dashboard = await apiRequest(buildDashboardQuery());
  const operacaoResumo = await apiRequest(buildOperacaoDiaQuery());
  state.operacaoResumo = operacaoResumo;
  const promotorIds = new Set((state.dashboard.linhas ?? []).map((linha) => String(linha.promotorId ?? "")));
  const promotorIdsOperacao = new Set((operacaoResumo.linhas ?? []).map((linha) => String(linha.promotorId ?? "")));
  const movimentos = await apiRequest("/movimentos");
  state.dashboardMovimentosMap = buildDashboardMovimentosMap(
    movimentos,
    String(el("dashData").value || "").slice(0, 10),
    promotorIds
  );
  state.operacaoMovimentosMap = buildDashboardMovimentosMap(
    movimentos,
    operacaoDataSelecionadaISO(),
    promotorIdsOperacao
  );
  renderDashboard(state.dashboard);
  renderOperacaoDia(operacaoResumo);
}

async function refreshData() {
  state.empresasCadastro = await apiRequest("/empresas-cadastro");
  state.fornecedores = await apiRequest("/fornecedores");
  state.promotores = await apiRequest("/promotores");
  renderFornecedores(state.fornecedores);
  renderPromotores(state.promotores);
  syncFornecedorSelect();
  const empresaSelecionada = String(el("cfgEmpresaId")?.value || "").trim();
  if (empresaSelecionada) {
    try {
      await carregarConfiguracaoEmpresaSelecionada();
    } catch (e) {
      setConfiguracaoMessage(`Falha ao carregar configuração: ${e.message}`, true);
      setConfiguracaoFormEnabled(false);
    }
  } else {
    setConfiguracaoFormEnabled(false);
    limparConfiguracaoForm();
  }
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

async function excluirFornecedor(id, nome) {
  if (!state.auth?.isAdmin) {
    throw new Error("Somente ADMIN pode excluir fornecedor");
  }
  const confirmar = await showConfirmDialog({
    title: "Excluir fornecedor",
    message: `Deseja excluir o fornecedor ${nome || id}?`
  });
  if (!confirmar) return;
  await apiRequest(`/fornecedores/${id}`, "DELETE");
  setFornecedorMessage("Fornecedor excluído com sucesso.");
  await refreshData();
}

async function excluirPromotor(id, nome) {
  if (!state.auth?.isAdmin) {
    throw new Error("Somente ADMIN pode excluir promotor");
  }
  const confirmar = await showConfirmDialog({
    title: "Excluir promotor",
    message: `Deseja excluir o promotor ${nome || id}?`
  });
  if (!confirmar) return;
  await apiRequest(`/promotores/${id}`, "DELETE");
  setPromotorMessage("Promotor excluído com sucesso.");
  await refreshData();
}

async function excluirUsuario(username) {
  if (!state.auth?.isAdmin) {
    throw new Error("Somente ADMIN pode excluir usuário");
  }
  const confirmar = await showConfirmDialog({
    title: "Excluir usuário",
    message: `Deseja excluir o usuário ${username}?`
  });
  if (!confirmar) return;
  await apiRequest(`/auth/admin/usuarios/${encodeURIComponent(username)}`, "DELETE");
  setUsuarioMessage("Usuário excluído com sucesso.");
  await refreshUsuarios();
}

async function excluirMovimento(movimentoId, tipo, promotorNome) {
  if (!state.auth?.isAdmin) {
    throw new Error("Somente ADMIN pode excluir operação");
  }
  const confirmar = await showConfirmDialog({
    title: "Excluir operação",
    message: `Deseja excluir ${tipo.toLowerCase()} de ${promotorNome || "promotor"}?`
  });
  if (!confirmar) return;
  await apiRequest(`/movimentos/${movimentoId}`, "DELETE");
  setMovimentoMessage("Operação excluída com sucesso.");
  await refreshData();
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
  validarMovimentacaoNaDataSelecionada();
  const promotorId = el("mPromotorId").value;
  if (!promotorId) {
    throw new Error("Informe um promotor válido no campo de busca");
  }

  const promotorSelecionado = state.promotores.find((p) => String(p.id) === String(promotorId));
  const promotorNome = promotorSelecionado?.nome ?? "";
  const fornecedorNome = promotorSelecionado?.fornecedorNome ?? "";

  const payload = {
    promotorId,
    responsavel: state.auth?.username ?? "",
    observacao: el("mObservacao").value.trim()
  };

  await apiRequest("/movimentos/entrada", "POST", payload);
  clearMovimentoForm();
  setMovimentoMessage("");
  await refreshData();
  await showConfirmDialog({
    title: "Entrada registrada",
    message: `Entrada de ${promotorNome} - ${fornecedorNome} realizada com sucesso.`,
    confirmText: "OK",
    showCancel: false
  });
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

function setAjusteHorarioModalMessage(message) {
  const field = el("ajusteHorarioMessage");
  if (!field) return;
  field.textContent = message || "";
}

function toDateTimeLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
  const normalized = String(value).replace(" ", "T");
  return normalized.length >= 16 ? normalized.slice(0, 16) : "";
}

function toApiLocalDateTime(value) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function openAjusteHorarioModal({ movimentoId, tipo, promotorNome, dataHoraAtual }) {
  if (!state.auth?.isAdmin || !movimentoId) return;
  state.ajusteHorarioModalContext = {
    movimentoId,
    tipo: tipo || "MOVIMENTO",
    promotorNome: promotorNome || "",
    dataHoraAtual: dataHoraAtual || ""
  };

  el("ajusteHorarioMovimentoId").value = movimentoId;
  el("ajusteHorarioResumo").textContent = `${tipo} - ${promotorNome || "Promotor"} (${formatHoraMinuto(dataHoraAtual) || "-"})`;
  el("ajusteHorarioDataHora").value = toDateTimeLocalInputValue(dataHoraAtual);
  el("ajusteHorarioMotivo").value = "";
  setAjusteHorarioModalMessage("");
  el("ajusteHorarioModal").classList.remove("is-hidden");
  el("ajusteHorarioModal").setAttribute("aria-hidden", "false");
  el("ajusteHorarioDataHora").focus();
}

function closeAjusteHorarioModal() {
  state.ajusteHorarioModalContext = null;
  setAjusteHorarioModalMessage("");
  el("ajusteHorarioModal").classList.add("is-hidden");
  el("ajusteHorarioModal").setAttribute("aria-hidden", "true");
}

async function salvarAjusteHorarioModal() {
  if (!state.auth?.isAdmin) {
    throw new Error("Somente ADMIN pode ajustar horário");
  }

  const ctx = state.ajusteHorarioModalContext;
  if (!ctx?.movimentoId) {
    closeAjusteHorarioModal();
    return;
  }

  const novaDataHoraInput = el("ajusteHorarioDataHora").value.trim();
  const motivo = el("ajusteHorarioMotivo").value.trim();
  if (!novaDataHoraInput) {
    setAjusteHorarioModalMessage("Informe a nova data/hora.");
    return;
  }
  if (!motivo) {
    setAjusteHorarioModalMessage("Informe o motivo do ajuste.");
    return;
  }

  const saveBtn = el("btnSalvarAjusteHorarioModal");
  saveBtn.disabled = true;
  try {
    await apiRequest(`/movimentos/${ctx.movimentoId}/ajuste-horario`, "PATCH", {
      novaDataHora: toApiLocalDateTime(novaDataHoraInput),
      motivo
    });
    closeAjusteHorarioModal();
    setMovimentoMessage("Horário ajustado com sucesso.");
    await refreshData();
  } catch (e) {
    setAjusteHorarioModalMessage(`Falha ao ajustar horário: ${e.message}`);
    log("Falha ao ajustar horário", { error: e.message, movimentoId: ctx.movimentoId });
  } finally {
    saveBtn.disabled = false;
  }
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
  const acessaWeb = el("uAcessaWeb").value === "true";
  const acessaMobile = el("uAcessaMobile").value === "true";
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
      { username, perfil, status, acessaWeb, acessaMobile }
    );
    setUsuarioMessage("");
    log("Usuário atualizado por gestor/admin", { usernameAnterior: state.editingUser, usernameNovo: username, perfil, status, acessaWeb, acessaMobile });
  } else {
    const response = await apiRequest("/auth/admin/usuarios", "POST", { username, perfil, status, acessaWeb, acessaMobile });
    setUsuarioMessage("");
    log("Usuário criado por gestor/admin", { username: response.username, perfil: response.perfil, status: response.status, acessaWeb: response.acessaWeb, acessaMobile: response.acessaMobile });
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
  closeUserModal();
  await refreshUsuarios();
}

function logout() {
  closeInlinePanels();
  closeLookupModal();
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
  cancelUserEdition();
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
  if (el("cfgEmpresaId")) el("cfgEmpresaId").value = "";
  setConfiguracaoFormEnabled(false);
  limparConfiguracaoForm();
  setConfiguracaoMessage("");
  closeEmpresaContratanteModal();
  closeUserModal();
  activateConfiguracoesTab("config-tab-gerais");
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
  el("btnNovaEmpresaContratante").addEventListener("click", openEmpresaContratanteModal);
  el("tabConfiguracoesBtn").addEventListener("click", () => {
    const empresasContratantes = listEmpresasContratantes();
    if (!el("cfgEmpresaId").value && empresasContratantes.length) {
      el("cfgEmpresaId").value = String(empresasContratantes[0].id);
    }
    if (el("cfgEmpresaId").value) {
      carregarConfiguracaoEmpresaSelecionada().catch((e) => {
        setConfiguracaoMessage(`Falha ao carregar configuração: ${e.message}`, true);
        log("Falha ao carregar configuração", { error: e.message });
      });
    } else {
      setConfiguracaoFormEnabled(false);
      limparConfiguracaoForm();
      setConfiguracaoMessage("Cadastre a empresa contratante para configurar regras.");
    }
  });
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
  el("btnRefreshOperacaoDia").addEventListener("click", () => {
    refreshDashboard().catch((e) => {
      setMovimentoMessage(`Falha ao carregar operação do dia: ${e.message}`);
      log("Falha ao atualizar acompanhamento do dia", { error: e.message });
    });
  });
  el("mDataOperacao").addEventListener("change", () => {
    atualizarIndicadorModoOperacao();
    refreshDashboard().catch((e) => {
      setMovimentoMessage(`Falha ao carregar operação do dia: ${e.message}`);
      log("Falha ao trocar data da operação", { error: e.message });
    });
  });
  el("cfgEncerramentoAuto").addEventListener("change", atualizarRegrasCamposConfiguracao);
  el("cfgEmpresaId").addEventListener("change", () => {
    carregarConfiguracaoEmpresaSelecionada().catch((e) => {
      setConfiguracaoMessage(`Falha ao carregar configuração: ${e.message}`, true);
      setConfiguracaoFormEnabled(false);
      log("Falha ao trocar empresa de configuração", { error: e.message });
    });
  });
  el("btnLoadEmpresaConfig").addEventListener("click", () => {
    carregarConfiguracaoEmpresaSelecionada().catch((e) => {
      setConfiguracaoMessage(`Falha ao carregar configuração: ${e.message}`, true);
      setConfiguracaoFormEnabled(false);
      log("Falha ao carregar configuração", { error: e.message });
    });
  });
  el("btnSalvarConfigEmpresa").addEventListener("click", () => {
    salvarConfiguracaoEmpresaSelecionada().catch((e) => {
      setConfiguracaoMessage(`Falha ao salvar configuração: ${e.message}`, true);
      log("Falha ao salvar configuração da empresa", { error: e.message });
    });
  });
  el("btnResetConfigEmpresa").addEventListener("click", () => {
    restaurarConfiguracaoPadraoEmpresaSelecionada().catch((e) => {
      setConfiguracaoMessage(`Falha ao restaurar configuração: ${e.message}`, true);
      log("Falha ao restaurar configuração da empresa", { error: e.message });
    });
  });
  el("btnConsultarCnpjEmpresa").addEventListener("click", () => {
    consultarCnpjEmpresaContratante().catch((e) => {
      setEmpresaContratanteModalMessage(`Falha ao consultar CNPJ: ${e.message}`, true);
      log("Falha na consulta de CNPJ da empresa contratante", { error: e.message });
    });
  });
  el("btnAbrirConsultaCnpjExterna").addEventListener("click", abrirConsultaCnpjExterna);
  el("btnCancelarEmpresaContratanteModal").addEventListener("click", closeEmpresaContratanteModal);
  el("btnSalvarEmpresaContratanteModal").addEventListener("click", () => {
    salvarEmpresaContratanteModal().catch((e) => {
      setEmpresaContratanteModalMessage(`Falha ao salvar empresa: ${e.message}`, true);
      log("Falha ao salvar empresa contratante", { error: e.message });
    });
  });
  el("empresaContratanteModal").addEventListener("click", (event) => {
    if (event.target !== el("empresaContratanteModal")) return;
    closeEmpresaContratanteModal();
  });
  el("adminUsersCard").addEventListener("click", (event) => {
    if (event.target !== el("adminUsersCard")) return;
    cancelUserEdition();
  });
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
  el("pFornecedorSearch").addEventListener("input", () => {
    el("pFornecedorId").value = "";
    if (!el("pFornecedorInlinePanel").classList.contains("is-hidden")) {
      openFornecedorInlinePanel();
    }
  });
  el("pFornecedorSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resolveCadastroFornecedorFromSearch(true);
  });
  el("btnFindFornecedor").addEventListener("click", () => {
    closeInlinePanels();
    openLookupModal("fornecedor");
  });
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
  el("mPromotorSearch").addEventListener("input", () => {
    el("mPromotorId").value = "";
    updateMovimentoFornecedorFromPromotor();
    if (!el("mPromotorInlinePanel").classList.contains("is-hidden")) {
      openPromotorInlinePanel();
    }
  });
  el("mPromotorSearch").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    resolveMovimentoPromotorFromSearch(true);
  });
  el("btnFindPromotor").addEventListener("click", () => {
    closeInlinePanels();
    openLookupModal("promotor");
  });
  el("mFiltroNome").addEventListener("input", () => {
    state.operacaoFilter = el("mFiltroNome").value || "";
    renderOperacaoDia(state.operacaoResumo);
  });
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
  el("btnCancelarAjusteHorarioModal").addEventListener("click", closeAjusteHorarioModal);
  el("btnSalvarAjusteHorarioModal").addEventListener("click", () => {
    salvarAjusteHorarioModal().catch((e) => {
      setAjusteHorarioModalMessage(`Falha ao ajustar horário: ${e.message}`);
      log("Falha ao salvar ajuste de horário", { error: e.message });
    });
  });
  el("ajusteHorarioModal").addEventListener("click", (event) => {
    if (event.target !== el("ajusteHorarioModal")) return;
    closeAjusteHorarioModal();
  });
  el("btnConfirmModalCancel").addEventListener("click", () => resolveConfirmDialog(false));
  el("btnConfirmModalOk").addEventListener("click", () => resolveConfirmDialog(true));
  el("confirmModalSecret").addEventListener("focus", () => el("confirmModalSecret").select());
  el("confirmModalSecret").addEventListener("click", () => el("confirmModalSecret").select());
  el("confirmModal").addEventListener("click", (event) => {
    if (event.target !== el("confirmModal")) return;
    resolveConfirmDialog(false);
  });
  el("btnLookupSearch").addEventListener("click", runLookupModalSearch);
  el("btnLookupCancel").addEventListener("click", closeLookupModal);
  el("btnLookupSelect").addEventListener("click", confirmLookupModalSelection);
  el("lookupId").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runLookupModalSearch();
  });
  el("lookupNome").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runLookupModalSearch();
  });
  el("lookupModal").addEventListener("click", (event) => {
    if (event.target !== el("lookupModal")) return;
    closeLookupModal();
  });
  document.addEventListener("click", (event) => {
    const fornecedorBox = el("pFornecedorInlinePanel");
    const fornecedorRoot = el("pFornecedorSearch")?.closest("label");
    const promotorBox = el("mPromotorInlinePanel");
    const promotorRoot = el("mPromotorSearch")?.closest("label");
    const target = event.target;
    if (fornecedorBox && fornecedorRoot && !fornecedorRoot.contains(target)) {
      fornecedorBox.classList.add("is-hidden");
    }
    if (promotorBox && promotorRoot && !promotorRoot.contains(target)) {
      promotorBox.classList.add("is-hidden");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!el("confirmModal").classList.contains("is-hidden")) {
      resolveConfirmDialog(false);
      return;
    }
    if (!el("lookupModal").classList.contains("is-hidden")) {
      closeLookupModal();
      return;
    }
    if (!el("empresaContratanteModal").classList.contains("is-hidden")) {
      closeEmpresaContratanteModal();
      return;
    }
    if (!el("adminUsersCard").classList.contains("is-hidden")) {
      cancelUserEdition();
      return;
    }
    if (!el("ajusteHorarioModal").classList.contains("is-hidden")) {
      closeAjusteHorarioModal();
      return;
    }
    if (el("saidaModal").classList.contains("is-hidden")) return;
    closeSaidaModal();
  });
  el("btnNovoUsuario").addEventListener("click", () => {
    clearUserForm();
    setUserFormMode("new");
    setUsuarioMessage("Preencha os campos e clique em Salvar.");
    openUserModal();
  });
  el("btnCancelarUsuario").addEventListener("click", async () => {
    cancelUserEdition();
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
setupConfiguracoesTabs();
initDashboardDefaults();
clearUserForm();
setUserFormMode("view");
clearFornecedorForm();
setFornecedorFormMode("view");
clearPromotorForm();
setPromotorFormMode("view");
setConfiguracaoFormEnabled(false);
limparConfiguracaoForm();
activateConfiguracoesTab("config-tab-gerais");
loadSavedLogin();
showLoginView();

