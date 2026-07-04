const STORE_KEY = "finance-local-v1";

const DEFAULT_ISR_TABLES = {
  quincenal: [
    { lower: 0.01, upper: 368.1, fixed: 0, rate: 1.92 },
    { lower: 368.11, upper: 3124.35, fixed: 7.05, rate: 6.4 },
    { lower: 3124.36, upper: 5490.75, fixed: 183.45, rate: 10.88 },
    { lower: 5490.76, upper: 6382.8, fixed: 441, rate: 16 },
    { lower: 6382.81, upper: 7641.9, fixed: 583.65, rate: 17.92 },
    { lower: 7641.91, upper: 15412.8, fixed: 809.25, rate: 21.36 },
    { lower: 15412.81, upper: 24292.65, fixed: 2469.15, rate: 23.52 },
    { lower: 24292.66, upper: 46378.5, fixed: 4557.75, rate: 30 },
    { lower: 46378.51, upper: 61838.1, fixed: 11183.4, rate: 32 },
    { lower: 61838.11, upper: 185514.3, fixed: 16130.55, rate: 34 },
    { lower: 185514.31, upper: 999999999, fixed: 58180.35, rate: 35 },
  ],
  mensual: [
    { lower: 0.01, upper: 746.04, fixed: 0, rate: 1.92 },
    { lower: 746.05, upper: 6332.05, fixed: 14.32, rate: 6.4 },
    { lower: 6332.06, upper: 11128.01, fixed: 371.83, rate: 10.88 },
    { lower: 11128.02, upper: 12935.82, fixed: 893.63, rate: 16 },
    { lower: 12935.83, upper: 15487.71, fixed: 1182.88, rate: 17.92 },
    { lower: 15487.72, upper: 31236.49, fixed: 1640.18, rate: 21.36 },
    { lower: 31236.5, upper: 49233, fixed: 5004.12, rate: 23.52 },
    { lower: 49233.01, upper: 93993.9, fixed: 9236.89, rate: 30 },
    { lower: 93993.91, upper: 125325.2, fixed: 22665.17, rate: 32 },
    { lower: 125325.21, upper: 375975.61, fixed: 32691.18, rate: 34 },
    { lower: 375975.62, upper: 999999999, fixed: 117912.32, rate: 35 },
  ],
};

const state = {
  store: loadStore(),
  activeUser: null,
  view: "dashboard",
  authTab: "login",
};

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && Array.isArray(saved.users)) return saved;
  } catch (error) {
    console.warn("No se pudo leer el almacenamiento local", error);
  }
  return { users: [], lastUserId: null };
}

function saveStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.store));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currency(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getUser() {
  return state.store.users.find((user) => user.id === state.activeUser);
}

function setMessage(id, text, type = "ok") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `message show ${type}`;
  setTimeout(() => {
    el.className = "message";
  }, 3800);
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function numberValue(value) {
  return Number.parseFloat(value || "0") || 0;
}

function createUser(formData, passwordHash, salt) {
  const baseSalary = numberValue(formData.baseSalary);
  const user = {
    id: uid("usr"),
    createdAt: new Date().toISOString(),
    credentials: {
      username: formData.username.trim(),
      employeeId: formData.employeeId.trim(),
      salt,
      passwordHash,
    },
    profile: {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      rfc: formData.rfc.trim().toUpperCase(),
      curp: formData.curp.trim().toUpperCase(),
      address: formData.address.trim(),
      jobTitle: formData.jobTitle.trim(),
      company: formData.company.trim(),
      payFrequency: formData.payFrequency,
      baseSalary,
    },
    payroll: [
      {
        id: uid("pay"),
        date: today(),
        period: formData.payFrequency,
        concept: "Nomina base",
        gross: baseSalary,
        deductions: 0,
        notes: "Registro inicial editable",
      },
    ],
    expenses: [],
    sat: {
      isrTables: JSON.parse(JSON.stringify(DEFAULT_ISR_TABLES)),
      ivaRate: 16,
      notes:
        "Tarifas precargadas como referencia. Verifica y edita los rangos con informacion vigente del SAT antes de declarar.",
    },
  };
  return user;
}

function renderAuth() {
  document.getElementById("app").innerHTML = `
    <main class="auth-shell">
      <section class="auth-hero">
        <div class="brand"><span class="brand-mark">F</span><span>FINANCE Local</span></div>
        <div>
          <h1>Control privado para tu nomina y gastos.</h1>
          <p>Registra perfiles, organiza ingresos quincenales o mensuales, captura gastos y calcula estimaciones SAT editables. Todo queda en este equipo.</p>
          <ul class="trust-list">
            <li><span class="dot"></span> Datos guardados en almacenamiento local del navegador</li>
            <li><span class="dot"></span> Respaldo manual en archivo JSON para GitHub o USB</li>
            <li><span class="dot"></span> Acceso por usuario, ID y contrasena</li>
          </ul>
        </div>
        <p class="hint">Uso personal. No sustituye asesoria contable ni declaracion oficial.</p>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <div class="tabs">
            <button class="tab-btn ${state.authTab === "login" ? "active" : ""}" data-auth="login">Iniciar sesion</button>
            <button class="tab-btn ${state.authTab === "register" ? "active" : ""}" data-auth="register">Registrar</button>
          </div>
          ${state.authTab === "login" ? loginForm() : registerForm()}
        </div>
      </section>
    </main>
  `;
  bindAuth();
}

function loginForm() {
  return `
    <form class="form" id="loginForm">
      <div>
        <h2>Entrar a perfil existente</h2>
        <p>Usa el usuario, numero ID y contrasena registrados.</p>
      </div>
      <label class="field"><span>Usuario</span><input name="username" autocomplete="username" required /></label>
      <label class="field"><span>Numero ID</span><input name="employeeId" required /></label>
      <label class="field"><span>Contrasena</span><input type="password" name="password" autocomplete="current-password" required /></label>
      <div id="loginMsg" class="message"></div>
      <button class="primary" type="submit">Iniciar sesion</button>
    </form>
  `;
}

function registerForm() {
  return `
    <form class="form" id="registerForm">
      <div>
        <h2>Abrir nuevo perfil</h2>
        <p>Todos los datos se pueden editar despues desde el apartado Perfil.</p>
      </div>
      <div class="grid two">
        <label class="field"><span>Nombre completo</span><input name="fullName" required /></label>
        <label class="field"><span>Usuario</span><input name="username" autocomplete="username" required /></label>
        <label class="field"><span>Numero ID</span><input name="employeeId" required /></label>
        <label class="field"><span>Correo</span><input type="email" name="email" /></label>
        <label class="field"><span>Telefono</span><input name="phone" /></label>
        <label class="field"><span>RFC</span><input name="rfc" maxlength="13" /></label>
        <label class="field"><span>CURP</span><input name="curp" maxlength="18" /></label>
        <label class="field"><span>Puesto</span><input name="jobTitle" /></label>
        <label class="field"><span>Empresa</span><input name="company" /></label>
        <label class="field"><span>Frecuencia de pago</span>
          <select name="payFrequency">
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </select>
        </label>
        <label class="field"><span>Nomina base</span><input type="number" name="baseSalary" min="0" step="0.01" required /></label>
        <label class="field"><span>Contrasena</span><input type="password" name="password" autocomplete="new-password" minlength="6" required /></label>
      </div>
      <label class="field"><span>Domicilio</span><textarea name="address"></textarea></label>
      <div id="registerMsg" class="message"></div>
      <button class="primary" type="submit">Crear perfil</button>
    </form>
  `;
}

function bindAuth() {
  document.querySelectorAll("[data-auth]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.authTab = btn.dataset.auth;
      renderAuth();
    });
  });

  document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const user = state.store.users.find(
      (item) =>
        item.credentials.username.toLowerCase() === data.username.trim().toLowerCase() &&
        item.credentials.employeeId === data.employeeId.trim(),
    );
    if (!user) {
      setMessage("loginMsg", "No encontre un perfil con esos datos.", "error");
      return;
    }
    const hash = await sha256(`${user.credentials.salt}:${data.password}`);
    if (hash !== user.credentials.passwordHash) {
      setMessage("loginMsg", "La contrasena no coincide.", "error");
      return;
    }
    state.activeUser = user.id;
    state.store.lastUserId = user.id;
    saveStore();
    renderApp();
  });

  document.getElementById("registerForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const exists = state.store.users.some(
      (user) =>
        user.credentials.username.toLowerCase() === data.username.trim().toLowerCase() ||
        user.credentials.employeeId === data.employeeId.trim(),
    );
    if (exists) {
      setMessage("registerMsg", "Ese usuario o numero ID ya existe.", "error");
      return;
    }
    const salt = uid("salt");
    const passwordHash = await sha256(`${salt}:${data.password}`);
    const user = createUser(data, passwordHash, salt);
    state.store.users.push(user);
    state.activeUser = user.id;
    state.store.lastUserId = user.id;
    saveStore();
    renderApp();
  });
}

function renderApp() {
  const user = getUser();
  if (!user) {
    state.activeUser = null;
    renderAuth();
    return;
  }

  document.getElementById("app").innerHTML = `
    <main class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">F</span><span>FINANCE Local</span></div>
        <div class="profile-chip">
          <strong>${escapeHtml(user.profile.fullName || user.credentials.username)}</strong>
          <span>ID ${escapeHtml(user.credentials.employeeId)}</span>
        </div>
        <nav class="nav">
          ${navButton("dashboard", "Panel")}
          ${navButton("payroll", "Nomina")}
          ${navButton("expenses", "Gastos")}
          ${navButton("sat", "SAT")}
          ${navButton("profile", "Perfil")}
          ${navButton("backup", "Datos")}
        </nav>
        <div class="sidebar-footer">
          <button class="ghost" id="logoutBtn">Cerrar sesion</button>
        </div>
      </aside>
      <section class="main">
        <div class="topbar">
          <div>
            <h1>${viewTitle()}</h1>
            <p class="hint">${viewHint()}</p>
          </div>
          <div class="actions">
            <button class="secondary" id="quickPayBtn">+ Nomina</button>
            <button class="secondary" id="quickExpenseBtn">+ Gasto</button>
          </div>
        </div>
        ${renderView(user)}
      </section>
    </main>
  `;
  bindApp();
}

function navButton(view, label) {
  return `<button class="nav-btn ${state.view === view ? "active" : ""}" data-view="${view}">${label}</button>`;
}

function viewTitle() {
  return {
    dashboard: "Panel financiero",
    payroll: "Nomina",
    expenses: "Gastos",
    sat: "Calculadora SAT",
    profile: "Perfil editable",
    backup: "Datos y respaldo",
  }[state.view];
}

function viewHint() {
  return {
    dashboard: "Resumen de ingresos, gastos y saldo estimado.",
    payroll: "Registra pagos quincenales, mensuales, bonos y deducciones.",
    expenses: "Controla tus gastos por categoria, fecha y estado.",
    sat: "Calcula ISR estimado con tablas editables y configura IVA.",
    profile: "Actualiza datos personales, laborales y de acceso.",
    backup: "Exporta o importa tu informacion local.",
  }[state.view];
}

function totals(user) {
  const income = user.payroll.reduce((sum, item) => sum + numberValue(item.gross), 0);
  const deductions = user.payroll.reduce((sum, item) => sum + numberValue(item.deductions), 0);
  const expenses = user.expenses.reduce((sum, item) => sum + numberValue(item.amount), 0);
  return {
    income,
    deductions,
    expenses,
    net: income - deductions - expenses,
  };
}

function renderView(user) {
  return {
    dashboard: renderDashboard,
    payroll: renderPayroll,
    expenses: renderExpenses,
    sat: renderSat,
    profile: renderProfile,
    backup: renderBackup,
  }[state.view](user);
}

function renderDashboard(user) {
  const total = totals(user);
  const latestExpenses = user.expenses.slice(-5).reverse();
  return `
    <section class="cards">
      <div class="card"><span>Ingresos brutos</span><strong>${currency(total.income)}</strong></div>
      <div class="card"><span>Deducciones</span><strong>${currency(total.deductions)}</strong></div>
      <div class="card"><span>Gastos</span><strong>${currency(total.expenses)}</strong></div>
      <div class="card"><span>Saldo estimado</span><strong>${currency(total.net)}</strong></div>
    </section>
    <section class="panel">
      <div class="section-head">
        <div class="section-title"><h2>Actividad reciente</h2><p>Tus ultimos gastos registrados.</p></div>
      </div>
      ${latestExpenses.length ? expenseTable(latestExpenses, false) : `<div class="empty">Todavia no hay gastos registrados.</div>`}
    </section>
    <section class="panel">
      <div class="section-title"><h2>Estado de nomina</h2><p>${user.payroll.length} registros de pago guardados.</p></div>
    </section>
  `;
}

function renderPayroll(user) {
  return `
    <section class="panel">
      <div class="section-head">
        <div class="section-title"><h2>Nuevo registro</h2><p>Captura nomina, bono, ajuste o descuento.</p></div>
      </div>
      <form class="grid three" id="payrollForm">
        <label class="field"><span>Fecha</span><input type="date" name="date" value="${today()}" required /></label>
        <label class="field"><span>Periodo</span><select name="period"><option value="quincenal">Quincenal</option><option value="mensual">Mensual</option></select></label>
        <label class="field"><span>Concepto</span><input name="concept" value="Nomina" required /></label>
        <label class="field"><span>Ingreso bruto</span><input type="number" name="gross" min="0" step="0.01" required /></label>
        <label class="field"><span>Deducciones</span><input type="number" name="deductions" min="0" step="0.01" value="0" /></label>
        <label class="field"><span>Notas</span><input name="notes" /></label>
        <button class="primary" type="submit">Guardar nomina</button>
      </form>
    </section>
    <section class="panel">
      <div class="section-head"><div class="section-title"><h2>Registros guardados</h2><p>Edita directo en la tabla y guarda los cambios.</p></div></div>
      ${payrollTable(user.payroll)}
    </section>
  `;
}

function payrollTable(rows) {
  if (!rows.length) return `<div class="empty">No hay registros de nomina.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Periodo</th><th>Concepto</th><th>Bruto</th><th>Deducciones</th><th>Neto</th><th></th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row) => `
              <tr data-payroll="${row.id}">
                <td><input type="date" data-field="date" value="${escapeHtml(row.date)}" /></td>
                <td><select data-field="period"><option value="quincenal" ${row.period === "quincenal" ? "selected" : ""}>Quincenal</option><option value="mensual" ${row.period === "mensual" ? "selected" : ""}>Mensual</option></select></td>
                <td><input data-field="concept" value="${escapeHtml(row.concept)}" /></td>
                <td><input type="number" step="0.01" data-field="gross" value="${row.gross}" /></td>
                <td><input type="number" step="0.01" data-field="deductions" value="${row.deductions}" /></td>
                <td>${currency(numberValue(row.gross) - numberValue(row.deductions))}</td>
                <td><button class="danger" data-delete-payroll="${row.id}">Eliminar</button></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderExpenses(user) {
  return `
    <section class="panel">
      <div class="section-head"><div class="section-title"><h2>Nuevo gasto</h2><p>Registra pagos fijos, variables o pendientes.</p></div></div>
      <form class="grid three" id="expenseForm">
        <label class="field"><span>Fecha</span><input type="date" name="date" value="${today()}" required /></label>
        <label class="field"><span>Categoria</span><input name="category" value="General" required /></label>
        <label class="field"><span>Descripcion</span><input name="description" required /></label>
        <label class="field"><span>Monto</span><input type="number" name="amount" min="0" step="0.01" required /></label>
        <label class="field"><span>Estado</span><select name="status"><option value="paid">Pagado</option><option value="pending">Pendiente</option></select></label>
        <label class="field"><span>Metodo</span><input name="method" value="Tarjeta" /></label>
        <button class="primary" type="submit">Guardar gasto</button>
      </form>
    </section>
    <section class="panel">
      <div class="section-head"><div class="section-title"><h2>Gastos guardados</h2><p>Modifica cualquier dato desde la tabla.</p></div></div>
      ${expenseTable(user.expenses, true)}
    </section>
  `;
}

function expenseTable(rows, editable) {
  if (!rows.length) return `<div class="empty">No hay gastos registrados.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th>Estado</th><th>Metodo</th>${editable ? "<th></th>" : ""}</tr></thead>
        <tbody>
          ${rows
            .map((row) =>
              editable
                ? `<tr data-expense="${row.id}">
                    <td><input type="date" data-field="date" value="${escapeHtml(row.date)}" /></td>
                    <td><input data-field="category" value="${escapeHtml(row.category)}" /></td>
                    <td><input data-field="description" value="${escapeHtml(row.description)}" /></td>
                    <td><input type="number" step="0.01" data-field="amount" value="${row.amount}" /></td>
                    <td><select data-field="status"><option value="paid" ${row.status === "paid" ? "selected" : ""}>Pagado</option><option value="pending" ${row.status === "pending" ? "selected" : ""}>Pendiente</option></select></td>
                    <td><input data-field="method" value="${escapeHtml(row.method || "")}" /></td>
                    <td><button class="danger" data-delete-expense="${row.id}">Eliminar</button></td>
                  </tr>`
                : `<tr>
                    <td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.description)}</td><td>${currency(row.amount)}</td><td><span class="status ${row.status}">${row.status === "paid" ? "Pagado" : "Pendiente"}</span></td><td>${escapeHtml(row.method || "")}</td>
                  </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSat(user) {
  const salary = user.profile.baseSalary || 0;
  const frequency = user.profile.payFrequency || "quincenal";
  const result = calculateIsr(user.sat.isrTables[frequency], salary);
  return `
    <section class="panel">
      <div class="section-head">
        <div class="section-title"><h2>Estimacion rapida ISR</h2><p>El calculo usa la tabla ${frequency}. Edita los rangos si tu contador o el SAT publican cambios.</p></div>
      </div>
      <form class="grid three" id="satCalcForm">
        <label class="field"><span>Ingreso gravable</span><input type="number" name="income" min="0" step="0.01" value="${salary}" /></label>
        <label class="field"><span>Periodo</span><select name="period"><option value="quincenal" ${frequency === "quincenal" ? "selected" : ""}>Quincenal</option><option value="mensual" ${frequency === "mensual" ? "selected" : ""}>Mensual</option></select></label>
        <label class="field"><span>IVA configurable</span><input type="number" name="ivaRate" min="0" step="0.01" value="${user.sat.ivaRate}" /></label>
        <button class="primary" type="submit">Recalcular</button>
      </form>
      <div class="sat-result" id="satResult">
        ${satResultHtml(result, salary, user.sat.ivaRate)}
      </div>
      <p class="hint">${escapeHtml(user.sat.notes)}</p>
    </section>
    <section class="panel">
      <div class="section-head">
        <div class="section-title"><h2>Tablas ISR editables</h2><p>Selecciona periodo, ajusta limites, cuota fija y porcentaje.</p></div>
        <button class="secondary" id="addBracketBtn">+ Rango</button>
      </div>
      <label class="field" style="max-width: 260px;"><span>Tabla visible</span><select id="satTableSelect"><option value="quincenal">Quincenal</option><option value="mensual">Mensual</option></select></label>
      <div id="satTableWrap">${satTable(user.sat.isrTables.quincenal)}</div>
    </section>
  `;
}

function calculateIsr(table, income) {
  const row =
    table.find((item) => income >= numberValue(item.lower) && income <= numberValue(item.upper)) ||
    table[table.length - 1];
  if (!row) return { lower: 0, surplus: 0, fixed: 0, marginal: 0, tax: 0, rate: 0 };
  const surplus = Math.max(0, income - numberValue(row.lower));
  const marginal = surplus * (numberValue(row.rate) / 100);
  const tax = numberValue(row.fixed) + marginal;
  return { ...row, surplus, marginal, tax };
}

function satResultHtml(result, income, ivaRate) {
  const iva = income * (numberValue(ivaRate) / 100);
  return `
    <div><span>Base excedente</span><strong>${currency(result.surplus)}</strong></div>
    <div><span>ISR estimado</span><strong>${currency(result.tax)}</strong></div>
    <div><span>Ingreso despues de ISR</span><strong>${currency(income - result.tax)}</strong></div>
    <div><span>IVA referencia</span><strong>${currency(iva)}</strong></div>
  `;
}

function satTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Limite inferior</th><th>Limite superior</th><th>Cuota fija</th><th>% excedente</th><th></th></tr></thead>
        <tbody>
          ${rows
            .map(
              (row, index) => `
              <tr data-bracket="${index}">
                <td><input type="number" step="0.01" data-field="lower" value="${row.lower}" /></td>
                <td><input type="number" step="0.01" data-field="upper" value="${row.upper}" /></td>
                <td><input type="number" step="0.01" data-field="fixed" value="${row.fixed}" /></td>
                <td><input type="number" step="0.01" data-field="rate" value="${row.rate}" /></td>
                <td><button class="danger" data-delete-bracket="${index}">Eliminar</button></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProfile(user) {
  return `
    <section class="panel">
      <form class="grid two" id="profileForm">
        <label class="field"><span>Nombre completo</span><input name="fullName" value="${escapeHtml(user.profile.fullName)}" required /></label>
        <label class="field"><span>Usuario</span><input name="username" value="${escapeHtml(user.credentials.username)}" required /></label>
        <label class="field"><span>Numero ID</span><input name="employeeId" value="${escapeHtml(user.credentials.employeeId)}" required /></label>
        <label class="field"><span>Correo</span><input type="email" name="email" value="${escapeHtml(user.profile.email)}" /></label>
        <label class="field"><span>Telefono</span><input name="phone" value="${escapeHtml(user.profile.phone)}" /></label>
        <label class="field"><span>RFC</span><input name="rfc" value="${escapeHtml(user.profile.rfc)}" /></label>
        <label class="field"><span>CURP</span><input name="curp" value="${escapeHtml(user.profile.curp)}" /></label>
        <label class="field"><span>Puesto</span><input name="jobTitle" value="${escapeHtml(user.profile.jobTitle)}" /></label>
        <label class="field"><span>Empresa</span><input name="company" value="${escapeHtml(user.profile.company)}" /></label>
        <label class="field"><span>Frecuencia</span><select name="payFrequency"><option value="quincenal" ${user.profile.payFrequency === "quincenal" ? "selected" : ""}>Quincenal</option><option value="mensual" ${user.profile.payFrequency === "mensual" ? "selected" : ""}>Mensual</option></select></label>
        <label class="field"><span>Nomina base</span><input type="number" step="0.01" name="baseSalary" value="${user.profile.baseSalary}" /></label>
        <label class="field"><span>Nueva contrasena</span><input type="password" name="password" placeholder="Dejar vacia para conservar" /></label>
        <label class="field" style="grid-column: 1 / -1;"><span>Domicilio</span><textarea name="address">${escapeHtml(user.profile.address)}</textarea></label>
        <div id="profileMsg" class="message"></div>
        <button class="primary" type="submit">Guardar perfil</button>
      </form>
    </section>
  `;
}

function renderBackup() {
  return `
    <section class="panel">
      <div class="section-title"><h2>Respaldo local</h2><p>Descarga tu archivo JSON para mover tus datos a otro celular, tablet o computadora. Si lo guardas en GitHub, usa un repositorio privado.</p></div>
      <div class="actions" style="margin-top: 16px;">
        <button class="primary" id="exportBtn">Exportar JSON</button>
        <label class="secondary" for="importFile">Importar JSON</label>
        <input class="file-input" id="importFile" type="file" accept="application/json" />
      </div>
      <div id="backupMsg" class="message"></div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Uso en varios dispositivos</h2><p>Publica la app con GitHub Pages y abre la misma liga en cualquier dispositivo. Los datos no se sincronizan solos: exporta el respaldo en un dispositivo e importalo en el otro.</p></div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Privacidad</h2><p>La informacion se guarda en localStorage del navegador. Si borras datos del navegador, cambia de equipo o usas otro navegador, importa tu respaldo JSON para recuperarla.</p></div>
    </section>
  `;
}

function bindApp() {
  const user = getUser();
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      renderApp();
    });
  });
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    state.activeUser = null;
    renderAuth();
  });
  document.getElementById("quickPayBtn")?.addEventListener("click", () => {
    state.view = "payroll";
    renderApp();
  });
  document.getElementById("quickExpenseBtn")?.addEventListener("click", () => {
    state.view = "expenses";
    renderApp();
  });

  document.getElementById("payrollForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    user.payroll.push({
      id: uid("pay"),
      date: data.date,
      period: data.period,
      concept: data.concept,
      gross: numberValue(data.gross),
      deductions: numberValue(data.deductions),
      notes: data.notes,
    });
    saveStore();
    renderApp();
  });

  document.querySelectorAll("[data-payroll] input, [data-payroll] select").forEach((input) => {
    input.addEventListener("change", () => {
      const row = input.closest("[data-payroll]");
      const item = user.payroll.find((pay) => pay.id === row.dataset.payroll);
      item[input.dataset.field] = input.type === "number" ? numberValue(input.value) : input.value;
      saveStore();
      renderApp();
    });
  });
  document.querySelectorAll("[data-delete-payroll]").forEach((btn) => {
    btn.addEventListener("click", () => {
      user.payroll = user.payroll.filter((item) => item.id !== btn.dataset.deletePayroll);
      saveStore();
      renderApp();
    });
  });

  document.getElementById("expenseForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    user.expenses.push({
      id: uid("exp"),
      date: data.date,
      category: data.category,
      description: data.description,
      amount: numberValue(data.amount),
      status: data.status,
      method: data.method,
    });
    saveStore();
    renderApp();
  });

  document.querySelectorAll("[data-expense] input, [data-expense] select").forEach((input) => {
    input.addEventListener("change", () => {
      const row = input.closest("[data-expense]");
      const item = user.expenses.find((expense) => expense.id === row.dataset.expense);
      item[input.dataset.field] = input.type === "number" ? numberValue(input.value) : input.value;
      saveStore();
      renderApp();
    });
  });
  document.querySelectorAll("[data-delete-expense]").forEach((btn) => {
    btn.addEventListener("click", () => {
      user.expenses = user.expenses.filter((item) => item.id !== btn.dataset.deleteExpense);
      saveStore();
      renderApp();
    });
  });

  document.getElementById("satCalcForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    user.sat.ivaRate = numberValue(data.ivaRate);
    const result = calculateIsr(user.sat.isrTables[data.period], numberValue(data.income));
    document.getElementById("satResult").innerHTML = satResultHtml(result, numberValue(data.income), user.sat.ivaRate);
    saveStore();
  });

  const satSelect = document.getElementById("satTableSelect");
  satSelect?.addEventListener("change", () => {
    document.getElementById("satTableWrap").innerHTML = satTable(user.sat.isrTables[satSelect.value]);
    bindApp();
  });

  document.getElementById("addBracketBtn")?.addEventListener("click", () => {
    const period = document.getElementById("satTableSelect").value;
    user.sat.isrTables[period].push({ lower: 0, upper: 0, fixed: 0, rate: 0 });
    saveStore();
    document.getElementById("satTableWrap").innerHTML = satTable(user.sat.isrTables[period]);
    bindApp();
  });

  document.querySelectorAll("[data-bracket] input").forEach((input) => {
    input.addEventListener("change", () => {
      const period = document.getElementById("satTableSelect").value;
      const row = input.closest("[data-bracket]");
      user.sat.isrTables[period][Number(row.dataset.bracket)][input.dataset.field] = numberValue(input.value);
      saveStore();
    });
  });
  document.querySelectorAll("[data-delete-bracket]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = document.getElementById("satTableSelect").value;
      user.sat.isrTables[period].splice(Number(btn.dataset.deleteBracket), 1);
      saveStore();
      document.getElementById("satTableWrap").innerHTML = satTable(user.sat.isrTables[period]);
      bindApp();
    });
  });

  document.getElementById("profileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    const duplicate = state.store.users.some(
      (item) =>
        item.id !== user.id &&
        (item.credentials.username.toLowerCase() === data.username.trim().toLowerCase() ||
          item.credentials.employeeId === data.employeeId.trim()),
    );
    if (duplicate) {
      setMessage("profileMsg", "Ese usuario o numero ID ya pertenece a otro perfil.", "error");
      return;
    }
    user.credentials.username = data.username.trim();
    user.credentials.employeeId = data.employeeId.trim();
    if (data.password) {
      user.credentials.salt = uid("salt");
      user.credentials.passwordHash = await sha256(`${user.credentials.salt}:${data.password}`);
    }
    Object.assign(user.profile, {
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      rfc: data.rfc.trim().toUpperCase(),
      curp: data.curp.trim().toUpperCase(),
      address: data.address.trim(),
      jobTitle: data.jobTitle.trim(),
      company: data.company.trim(),
      payFrequency: data.payFrequency,
      baseSalary: numberValue(data.baseSalary),
    });
    saveStore();
    setMessage("profileMsg", "Perfil actualizado.");
    setTimeout(renderApp, 700);
  });

  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-respaldo-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importFile")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.users || !Array.isArray(imported.users)) throw new Error("Formato invalido");
        state.store = imported;
        state.activeUser = imported.lastUserId || imported.users[0]?.id || null;
        saveStore();
        renderApp();
      } catch (error) {
        setMessage("backupMsg", "No pude importar el archivo. Revisa que sea un respaldo valido.", "error");
      }
    };
    reader.readAsText(file);
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (state.store.lastUserId && state.store.users.some((user) => user.id === state.store.lastUserId)) {
  state.activeUser = state.store.lastUserId;
  renderApp();
} else {
  renderAuth();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("No se pudo registrar el modo instalable", error);
    });
  });
}
