const state = {
  promotores: [],
  movimentos: []
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
      <td>${p.empresaId ?? ""}</td>
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
      <td>${m.observacao ?? ""}</td>`;
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

async function refreshData() {
  state.promotores = await apiRequest("/promotores");
  state.movimentos = await apiRequest("/movimentos");
  renderPromotores(state.promotores);
  renderMovimentos(state.movimentos);
  syncPromotorSelect();
}

async function criarPromotor() {
  const payload = {
    nome: el("pNome").value.trim(),
    telefone: el("pTelefone").value.trim(),
    empresaId: Number(el("pEmpresaId").value),
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
  el("btnCriarPromotor").addEventListener("click", () => criarPromotor().catch((e) => log("Falha ao criar", { error: e.message })));
  el("btnEntrada").addEventListener("click", () => registrarMovimento("ENTRADA").catch((e) => log("Falha entrada", { error: e.message })));
  el("btnSaida").addEventListener("click", () => registrarMovimento("SAIDA").catch((e) => log("Falha saida", { error: e.message })));
  el("btnAjustar").addEventListener("click", () => ajustarHorario().catch((e) => log("Falha ajuste", { error: e.message })));

  el("btnFiltroPromotor").addEventListener("click", () => {
    const empresaId = el("filtroEmpresaPromotor").value.trim();
    if (!empresaId) return renderPromotores(state.promotores);
    renderPromotores(state.promotores.filter((p) => String(p.empresaId) === empresaId));
  });

  el("btnFiltroMov").addEventListener("click", () => {
    const promotorId = el("filtroPromotorMov").value.trim();
    if (!promotorId) return renderMovimentos(state.movimentos);
    renderMovimentos(state.movimentos.filter((m) => String(m.promotorId) === promotorId));
  });
}

bindActions();
refreshData().catch((e) => log("Falha inicial. Confira base URL e credenciais.", { error: e.message }));
