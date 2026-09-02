/* ===================================================
   Data Center Access & Equipment Tracking System - JS Engine
   Offline-Ready, Zero External Network Dependency Engine
   with Guaranteed LocalStorage Persistence & Toast Feedback
   =================================================== */

const STORAGE_KEY = "DC_ACCESS_MASTER_DB_V2";
const SESSION_KEY = "DC_ACCESS_CURRENT_USER_V2";

// Initial Default Seed Database matching ERD Schema
const DEFAULT_DB = {
  USERS: [
    { user_id: 101, email: "requester@dc.com", password: "pass123", name: "สมชาย ใจดี", department: "External Vendor (Network Co.)", role: "REQUESTER" },
    { user_id: 102, email: "supervisor@dc.com", password: "pass123", name: "คุณสุรชัย IT Manager", department: "IT Infrastructure Dept", role: "SUPERVISOR" },
    { user_id: 103, email: "gatekeeper@dc.com", password: "pass123", name: "สมศักดิ์ Gatekeeper", department: "Data Center Security Guard", role: "GATEKEEPER" },
    { user_id: 104, email: "admin@dc.com", password: "pass123", name: "วิชัย Security Auditor", department: "Internal Cyber Audit Team", role: "AUDITOR" }
  ],

  REQUESTS: [
    {
      request_id: 1001,
      requester_id: 101,
      purpose: "เข้าติดตั้ง Switch Cisco 24-Port ใน Rack A-04",
      purpose_category: "GENERAL_SERVICE",
      status: "APPROVED",
      created_at: "2026-07-23 08:00:00",
      timeframe: "23 ก.ค. 2026 (09:00 - 17:00 น.)"
    },
    {
      request_id: 1002,
      requester_id: 101,
      purpose: "สำเนาและรีเซ็ตการตั้งค่า Server Storage B-02 (เงื่อนไขพิเศษ)",
      purpose_category: "SENSITIVE_DATA_DELETE",
      status: "PENDING",
      created_at: "2026-07-23 08:20:00",
      timeframe: "23 ก.ค. 2026 (10:00 - 15:00 น.)"
    }
  ],

  VISITORS: [
    { visitor_id: 1, request_id: 1001, visitor_name: "สมชาย ใจดี", employee_id: "EMP-90812" },
    { visitor_id: 2, request_id: 1001, visitor_name: "กิตติพงษ์ ช่างเทคนิค", employee_id: "EMP-90813" },
    { visitor_id: 3, request_id: 1002, visitor_name: "สมชาย ใจดี", employee_id: "EMP-90812" }
  ],

  EQUIPMENTS: [
    { equip_id: 501, request_id: 1001, item_name: "Cisco Catalyst Switch 24P (S/N: CS-88129)", quantity_in: 2, quantity_out: 0, status: "WAITING_ENTRY" },
    { equip_id: 502, request_id: 1001, item_name: "สาย UTP Cat6 Patch Cable (กล่อง)", quantity_in: 5, quantity_out: 0, status: "WAITING_ENTRY" },
    { equip_id: 503, request_id: 1002, item_name: "External SSD Hard Drive 2TB (S/N: SSD-9921)", quantity_in: 1, quantity_out: 0, status: "WAITING_ENTRY" }
  ],

  APPROVALS: [
    { approval_id: 1, request_id: 1001, approver_id: 102, role_type: "IT Supervisor", decision: "APPROVED", remark: "อนุมัติให้เข้าตามเวลา Service ทั่วไป" }
  ],

  ACCESS_LOGS: [],
  CHECKOUT_AUDITS: []
};

// Memory fallback if browser restricts local storage on file:// protocol
let inMemoryDb = null;
let db = loadDatabase();
let currentUser = null;
let currentTab = "create-request";
let selectedErdTable = "USERS";

// Toast Notification Popup Helper
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  const msgEl = document.getElementById("toast-message");
  if (!toast || !msgEl) return;
  
  msgEl.textContent = message;
  toast.classList.remove("hidden");
  
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Load DB safely from LocalStorage with Memory Fallback
function loadDatabase() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn("LocalStorage access restricted, using in-memory store", e);
    if (inMemoryDb) return inMemoryDb;
  }
  const initDb = JSON.parse(JSON.stringify(DEFAULT_DB));
  saveDatabaseDirect(initDb);
  return initDb;
}

// Save DB safely to LocalStorage
function saveDatabase() {
  saveDatabaseDirect(db);
  showToast("💾 บันทึกข้อมูลลงในฐานข้อมูลเรียบร้อยแล้ว!");
}

function saveDatabaseDirect(dataObj) {
  inMemoryDb = dataObj;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObj));
  } catch (e) {
    console.warn("Could not save to LocalStorage", e);
  }
}

function resetDemoData() {
  if (confirm("คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) {
    db = JSON.parse(JSON.stringify(DEFAULT_DB));
    saveDatabaseDirect(db);
    showToast("🔄 รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว!");
    if (currentUser) applyUserSession(currentUser);
  }
}

// Page Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderVisitorInputRows();
  renderEquipmentInputRows();

  // Check saved user session
  try {
    const savedUser = sessionStorage.getItem(SESSION_KEY);
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      applyUserSession(currentUser);
      return;
    }
  } catch(e) {}
  
  showLoginScreen();
});

// Authentication Engine
function fillDemoAccount(email, pass) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = pass;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  const foundUser = db.USERS.find(u => u.email.toLowerCase() === email && u.password === pass);

  if (foundUser) {
    currentUser = foundUser;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch(e) {}
    applyUserSession(currentUser);
    showToast(`🔓 ยินดีต้อนรับคุณ ${currentUser.name} (${currentUser.role})`);
  } else {
    alert("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง! โปรดเลือกใช้อีเมลตัวอย่างด้านล่าง");
  }
}

function handleLogout() {
  currentUser = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
  showLoginScreen();
  showToast("ออกจากระบบเรียบร้อยแล้ว");
}

function showLoginScreen() {
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("main-app-workspace").classList.add("hidden");
}

function applyUserSession(user) {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("main-app-workspace").classList.remove("hidden");

  document.getElementById("headerUserName").textContent = user.name;
  document.getElementById("headerUserDept").textContent = user.department;
  
  const roleBadge = document.getElementById("headerRoleBadge");
  roleBadge.textContent = user.role;

  const navItems = document.querySelectorAll(".nav-item");
  let defaultTabForRole = "";

  navItems.forEach(item => {
    const allowedRoles = (item.getAttribute("data-roles") || "").split(",");
    if (allowedRoles.includes(user.role)) {
      item.style.display = "flex";
      if (!defaultTabForRole) defaultTabForRole = item.getAttribute("data-tab");
    } else {
      item.style.display = "none";
    }
  });

  const roleNotice = document.getElementById("roleNotice");

  switch(user.role) {
    case "REQUESTER":
      roleBadge.className = "badge badge-role";
      roleNotice.textContent = "สิทธิ์ผู้ยื่นคำร้อง (Requester Access)";
      defaultTabForRole = "create-request";
      break;
    case "SUPERVISOR":
      roleBadge.className = "badge badge-pending";
      roleNotice.textContent = "สิทธิ์ผู้อนุมัติ IT Supervisor";
      defaultTabForRole = "approvals";
      break;
    case "GATEKEEPER":
      roleBadge.className = "badge badge-inside";
      roleNotice.textContent = "สิทธิ์จุดตรวจ Data Center Gatekeeper";
      defaultTabForRole = "gatekeeper";
      break;
    case "AUDITOR":
      roleBadge.className = "badge badge-flagged";
      roleNotice.textContent = "สิทธิ์ผู้ตรวจสอบ Security Admin";
      defaultTabForRole = "audits";
      break;
  }

  if (defaultTabForRole) switchTab(defaultTabForRole);
  else updateUI();
}

function switchTab(tabId) {
  currentTab = tabId;
  
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add("active");

  const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (targetNav) targetNav.classList.add("active");

  updateUI();
}

// Dynamic Form Rows
function renderVisitorInputRows() {
  const tbody = document.getElementById("visitorsTableBody");
  tbody.innerHTML = `
    <tr>
      <td><input type="text" class="v-name" required value="สมชาย ใจดี" placeholder="ชื่อ-นามสกุล"></td>
      <td><input type="text" class="v-id" required value="EMP-90812" placeholder="รหัสพนักงาน/บัตรประชาชน"></td>
      <td><button type="button" class="btn btn-sm btn-danger" onclick="removeRow(this)">🗑️</button></td>
    </tr>
  `;
}

function addVisitorRow() {
  const tbody = document.getElementById("visitorsTableBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="v-name" required placeholder="ชื่อ-นามสกุล ผู้เข้า"></td>
    <td><input type="text" class="v-id" required placeholder="รหัสพนักงาน/บัตรประชาชน"></td>
    <td><button type="button" class="btn btn-sm btn-danger" onclick="removeRow(this)">🗑️</button></td>
  `;
  tbody.appendChild(tr);
}

function renderEquipmentInputRows() {
  const tbody = document.getElementById("equipmentsTableBody");
  tbody.innerHTML = `
    <tr>
      <td><input type="text" class="e-name" required value="Cisco Catalyst Switch 24-Port (S/N: CS-9912)" placeholder="ชื่ออุปกรณ์ และ Serial Number"></td>
      <td><input type="number" class="e-qty" required value="1" min="1"></td>
      <td><button type="button" class="btn btn-sm btn-danger" onclick="removeRow(this)">🗑️</button></td>
    </tr>
  `;
}

function addEquipmentRow() {
  const tbody = document.getElementById("equipmentsTableBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="e-name" required placeholder="ชื่ออุปกรณ์ / S/N"></td>
    <td><input type="number" class="e-qty" required value="1" min="1"></td>
    <td><button type="button" class="btn btn-sm btn-danger" onclick="removeRow(this)">🗑️</button></td>
  `;
  tbody.appendChild(tr);
}

function removeRow(btn) {
  const row = btn.closest("tr");
  if (row) row.remove();
}

function togglePurposeWarning() {
  const cat = document.getElementById("reqPurposeCategory").value;
  const box = document.getElementById("purposeWarningBox");
  if (cat !== "GENERAL_SERVICE") box.classList.remove("hidden");
  else box.classList.add("hidden");
}

// Create Request Handler
function handleCreateRequest(e) {
  e.preventDefault();

  const category = document.getElementById("reqPurposeCategory").value;
  const detail = document.getElementById("reqPurposeDetail").value;
  const timeframe = document.getElementById("reqTimeframe").value;

  const newReqId = 1000 + db.REQUESTS.length + 1;

  db.REQUESTS.push({
    request_id: newReqId,
    requester_id: currentUser ? currentUser.user_id : 101,
    purpose: `${detail} (${category})`,
    purpose_category: category,
    status: "PENDING",
    created_at: new Date().toLocaleString("th-TH"),
    timeframe: timeframe
  });

  document.querySelectorAll("#visitorsTableBody tr").forEach(r => {
    const name = r.querySelector(".v-name").value;
    const empId = r.querySelector(".v-id").value;
    if (name) {
      db.VISITORS.push({ visitor_id: db.VISITORS.length + 1, request_id: newReqId, visitor_name: name, employee_id: empId });
    }
  });

  document.querySelectorAll("#equipmentsTableBody tr").forEach(r => {
    const itemName = r.querySelector(".e-name").value;
    const qty = parseInt(r.querySelector(".e-qty").value) || 1;
    if (itemName) {
      db.EQUIPMENTS.push({ equip_id: 500 + db.EQUIPMENTS.length + 1, request_id: newReqId, item_name: itemName, quantity_in: qty, quantity_out: 0, status: "WAITING_ENTRY" });
    }
  });

  saveDatabase();
  alert(`ส่งคำร้องขออนุมัติเรียบร้อยแล้ว! รหัสคำร้องคือ #REQ-${newReqId}`);
  switchTab("my-requests");
}

// Supervisor Approval Handler
function approveRequest(reqId) {
  const req = db.REQUESTS.find(r => r.request_id === reqId);
  if (!req) return;

  req.status = "APPROVED";
  db.APPROVALS.push({
    approval_id: db.APPROVALS.length + 1,
    request_id: reqId,
    approver_id: currentUser ? currentUser.user_id : 102,
    role_type: "IT Supervisor",
    decision: "APPROVED",
    remark: "อนุมัติรายการเรียบร้อย"
  });

  saveDatabase();
  alert(`อนุมัติคำร้อง #REQ-${reqId} เรียบร้อยแล้ว! คำร้องพร้อมสำหรับการสแกนเข้า Data Center`);
  updateUI();
}

function rejectRequest(reqId) {
  const req = db.REQUESTS.find(r => r.request_id === reqId);
  if (!req) return;

  const reason = prompt("ระบุเหตุผลในการไม่อนุมัติ:") || "ไม่อนุมัติเนื่องจากข้อมูลไม่ครบถ้วน";
  req.status = "REJECTED";
  db.APPROVALS.push({
    approval_id: db.APPROVALS.length + 1,
    request_id: reqId,
    approver_id: currentUser ? currentUser.user_id : 102,
    role_type: "IT Supervisor",
    decision: "REJECTED",
    remark: reason
  });

  saveDatabase();
  alert(`ปฏิเสธคำร้อง #REQ-${reqId} เรียบร้อยแล้ว`);
  updateUI();
}

// Gatekeeper Beta Code Input Scanner
function parseRequestId(inputVal) {
  if (!inputVal) return null;
  const cleanStr = String(inputVal).replace(/[^0-9]/g, "");
  return parseInt(cleanStr) || null;
}

function processScanInByCode() {
  const val = document.getElementById("manualCodeInput").value || document.getElementById("quickSelectScanRequest").value;
  const reqId = parseRequestId(val);

  if (!reqId) return alert("โปรดป้อนรหัสคำร้อง เช่น REQ-1001 หรือ 1001");

  const req = db.REQUESTS.find(r => r.request_id === reqId);
  if (!req) return alert(`ไม่พบรหัสคำร้อง #REQ-${reqId} ในระบบ!`);

  if (req.status === "PENDING") return alert(`คำร้อง #REQ-${reqId} ยังอยู่ในสถานะ "รอหัวหน้าอนุมัติ" ไม่สามารถเข้าห้องได้`);
  if (req.status === "REJECTED") return alert(`คำร้อง #REQ-${reqId} ถูกไม่อนุมัติ`);
  if (req.status === "CHECKED_IN") return alert(`คำร้อง #REQ-${reqId} สแกนเข้าห้องไปแล้วเรียบร้อย`);
  if (req.status === "CLOSED" || req.status === "FLAGGED") return alert(`คำร้อง #REQ-${reqId} ปิดรายการไปแล้ว`);

  req.status = "CHECKED_IN";
  db.ACCESS_LOGS.push({
    log_id: db.ACCESS_LOGS.length + 1,
    request_id: reqId,
    entry_time: new Date().toLocaleTimeString("th-TH"),
    exit_time: null
  });

  db.EQUIPMENTS.filter(e => e.request_id === reqId).forEach(e => e.status = "INSIDE_DC");

  saveDatabase();
  document.getElementById("manualCodeInput").value = "";
  alert(`สแกนรหัส #REQ-${reqId} สำเร็จ! ต้อนรับผู้ปฏิบัติงานเข้าห้อง Data Center`);
  updateUI();
}

function processScanOutByCode() {
  const val = document.getElementById("manualCodeInput").value || document.getElementById("quickSelectScanRequest").value;
  const reqId = parseRequestId(val);

  if (!reqId) return alert("โปรดป้อนรหัสคำร้อง เช่น REQ-1001 หรือ 1001");

  const req = db.REQUESTS.find(r => r.request_id === reqId);
  if (!req) return alert(`ไม่พบรหัสคำร้อง #REQ-${reqId} ในระบบ!`);
  if (req.status !== "CHECKED_IN") return alert(`คำร้อง #REQ-${reqId} ไม่ได้อยู่ในสถานะกำลังปฏิบัติงานในห้อง`);

  openCheckoutAuditPanel(reqId);
}

function openCheckoutAuditPanel(reqId) {
  const req = db.REQUESTS.find(r => r.request_id === reqId);
  if (!req || req.status !== "CHECKED_IN") return alert("คำร้องนี้ไม่ได้อยู่ในสถานะกำลังปฏิบัติงาน");

  const panel = document.getElementById("checkoutAuditPanel");
  panel.classList.remove("hidden");
  document.getElementById("auditRequestId").value = reqId;

  document.getElementById("auditRequestSummary").innerHTML = `
    <strong>คำร้อง #REQ-${reqId}:</strong> ${req.purpose} | ผู้ขอ: ${db.USERS.find(u => u.user_id === req.requester_id)?.name || 'N/A'}
  `;

  const tbody = document.getElementById("auditEquipmentsTableBody");
  const equips = db.EQUIPMENTS.filter(e => e.request_id === reqId);

  tbody.innerHTML = equips.map(e => `
    <tr>
      <td><strong>${e.item_name}</strong></td>
      <td><span class="badge badge-info">${e.quantity_in} ชิ้น</span></td>
      <td>
        <input type="number" class="audit-qty-out form-control" data-equip-id="${e.equip_id}" value="${e.quantity_in}" min="0">
      </td>
      <td>
        <select class="audit-equip-status form-control">
          <option value="RETURNED_OK">ครบถ้วนสมบูรณ์ (OK)</option>
          <option value="DISCREPANCY">ไม่ครบถ้วน / สูญหาย</option>
          <option value="LEFT_INSIDE">ติดตั้งถาวรใน DC</option>
        </select>
      </td>
    </tr>
  `).join("");

  const condSec = document.getElementById("conditionalAuditSection");
  if (req.purpose_category !== "GENERAL_SERVICE") {
    condSec.classList.remove("hidden");
  } else {
    condSec.classList.add("hidden");
  }

  panel.scrollIntoView({ behavior: 'smooth' });
}

function hideAuditPanel() {
  document.getElementById("checkoutAuditPanel").classList.add("hidden");
}

function handleSaveExitAudit(e) {
  e.preventDefault();

  const reqId = parseInt(document.getElementById("auditRequestId").value);
  const req = db.REQUESTS.find(r => r.request_id === reqId);
  const remarks = document.getElementById("auditRemarks").value;
  const condCheck = document.getElementById("conditionalAuditCheck").value;

  let hasDiscrepancy = false;

  document.querySelectorAll("#auditEquipmentsTableBody tr").forEach(r => {
    const input = r.querySelector(".audit-qty-out");
    const equipId = parseInt(input.getAttribute("data-equip-id"));
    const qtyOut = parseInt(input.value) || 0;
    const status = r.querySelector(".audit-equip-status").value;

    const eq = db.EQUIPMENTS.find(e => e.equip_id === equipId);
    if (eq) {
      eq.quantity_out = qtyOut;
      eq.status = status;
      if (qtyOut !== eq.quantity_in && status !== "LEFT_INSIDE") {
        hasDiscrepancy = true;
      }
    }
  });

  if (req.purpose_category !== "GENERAL_SERVICE" && condCheck === "FAILED") {
    hasDiscrepancy = true;
  }

  const accessLog = db.ACCESS_LOGS.find(l => l.request_id === reqId && !l.exit_time);
  if (accessLog) {
    accessLog.exit_time = new Date().toLocaleTimeString("th-TH");
  }

  const auditResult = hasDiscrepancy ? "DISCREPANCY_FLAGGED" : "PASSED";
  db.CHECKOUT_AUDITS.push({
    audit_id: db.CHECKOUT_AUDITS.length + 1,
    request_id: reqId,
    checker_id: currentUser ? currentUser.user_id : 103,
    audit_result: auditResult,
    remarks: remarks || (hasDiscrepancy ? "พบอุปกรณ์ไม่ครบถ้วนตามรายการแจ้งเข้า" : "ตรวจสอบอุปกรณ์และเวลาออกเรียบร้อย"),
    audit_time: new Date().toLocaleString("th-TH")
  });

  req.status = hasDiscrepancy ? "FLAGGED" : "CLOSED";
  saveDatabase();
  hideAuditPanel();

  if (hasDiscrepancy) {
    alert(`คำร้อง #REQ-${reqId} ถูกบันทึกเป็นเหตุการณ์ผิดปกติ (FLAGGED / DISCREPANCY)! เนื่องจากอุปกรณ์ขาออกไม่ตรงหรือพบข้อผิดพลาดตามเงื่อนไข`);
  } else {
    alert(`การตรวจสอบเสร็จสิ้น! บันทึกเวลาออกและปิดคำร้อง #REQ-${reqId} สมบูรณ์`);
  }

  updateUI();
}

// UI Render Helpers
function updateUI() {
  renderMyRequests();
  renderApprovals();
  renderGatekeeperTerminal();
  renderAuditsAndIncidents();
  renderErdInspector();

  document.getElementById("myRequestsCount").textContent = db.REQUESTS.length;
  document.getElementById("pendingApprovalCount").textContent = db.REQUESTS.filter(r => r.status === "PENDING").length;
}

function getStatusBadge(status) {
  switch (status) {
    case "PENDING": return `<span class="badge badge-pending">รอหัวหน้าอนุมัติ</span>`;
    case "APPROVED": return `<span class="badge badge-approved">อนุมัติแล้ว (พร้อมเข้า)</span>`;
    case "REJECTED": return `<span class="badge badge-rejected">ไม่อนุมัติ</span>`;
    case "CHECKED_IN": return `<span class="badge badge-inside">อยู่ใน Data Center</span>`;
    case "CLOSED": return `<span class="badge badge-closed">ปิดคำร้องเรียบร้อย</span>`;
    case "FLAGGED": return `<span class="badge badge-flagged">พบเหตุผิดปกติ (Flagged)</span>`;
    default: return `<span class="badge">${status}</span>`;
  }
}

function renderMyRequests() {
  const titleSpan = document.getElementById("myRequestsNavTitle");
  if (titleSpan) {
    if (currentUser && currentUser.role === "REQUESTER") {
      titleSpan.textContent = "ติดตามคำร้องของฉัน (My Requests)";
    } else {
      titleSpan.textContent = "ประวัติและคำร้องทั้งหมด (All Requests)";
    }
  }

  const tbody = document.getElementById("myRequestsTableBody");
  tbody.innerHTML = db.REQUESTS.map(r => {
    const user = db.USERS.find(u => u.user_id === r.requester_id);
    return `
      <tr>
        <td><strong>#REQ-${r.request_id}</strong></td>
        <td>${user ? user.name : 'Unknown'}<br><span class="text-sm">${user ? user.department : ''}</span></td>
        <td>${r.purpose}</td>
        <td><span class="badge badge-info">${r.purpose_category}</span></td>
        <td>${getStatusBadge(r.status)}</td>
        <td>${r.created_at}</td>
        <td>
          ${r.status === 'APPROVED' || r.status === 'CHECKED_IN' ? 
            `<button class="btn btn-sm btn-outline" onclick="showQrModal(${r.request_id})">🔑 รหัส #REQ-${r.request_id}</button>` : 
            `<span class="text-sm">-</span>`}
        </td>
      </tr>
    `;
  }).join("");
}

function renderApprovals() {
  const tbody = document.getElementById("approvalsTableBody");
  const pendings = db.REQUESTS.filter(r => r.status === "PENDING");

  if (pendings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-sm">ไม่มีรายการคำร้องที่รอการอนุมัติในขณะนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = pendings.map(r => {
    const user = db.USERS.find(u => u.user_id === r.requester_id);
    const visitors = db.VISITORS.filter(v => v.request_id === r.request_id);
    const equips = db.EQUIPMENTS.filter(e => e.request_id === r.request_id);

    return `
      <tr>
        <td><strong>#REQ-${r.request_id}</strong></td>
        <td>${user ? user.name : ''}</td>
        <td>${r.purpose}</td>
        <td>${visitors.length} คน</td>
        <td>${equips.length} รายการ</td>
        <td>
          ${r.purpose_category !== 'GENERAL_SERVICE' ? 
            `<span class="badge badge-pending">⚠️ มีเงื่อนไขพิเศษ</span>` : 
            `<span class="badge badge-approved">Service ทั่วไป</span>`}
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-success" onclick="approveRequest(${r.request_id})">อนุมัติ</button>
            <button class="btn btn-sm btn-danger" onclick="rejectRequest(${r.request_id})">ไม่อนุมัติ</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderGatekeeperTerminal() {
  const select = document.getElementById("quickSelectScanRequest");
  const approvedOrInside = db.REQUESTS.filter(r => r.status === "APPROVED" || r.status === "CHECKED_IN");

  select.innerHTML = `<option value="">-- เลือกจากรายการที่อนุมัติแล้ว --</option>` + 
    approvedOrInside.map(r => `<option value="REQ-${r.request_id}">#REQ-${r.request_id} [${r.status}] - ${r.purpose.substring(0, 25)}...</option>`).join("");

  const tbody = document.getElementById("insideRoomTableBody");
  const insiders = db.REQUESTS.filter(r => r.status === "CHECKED_IN");

  if (insiders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-sm">ขณะนี้ไม่มีบุคคลอยู่ภายในห้อง Data Center</td></tr>`;
    return;
  }

  tbody.innerHTML = insiders.map(r => {
    const user = db.USERS.find(u => u.user_id === r.requester_id);
    const log = db.ACCESS_LOGS.find(l => l.request_id === r.request_id && !l.exit_time);
    const equips = db.EQUIPMENTS.filter(e => e.request_id === r.request_id);

    return `
      <tr>
        <td><strong>#REQ-${r.request_id}</strong></td>
        <td>${user ? user.name : ''}</td>
        <td><span class="text-cyan">${log ? log.entry_time : '-'}</span></td>
        <td>${equips.length} รายการ</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="openCheckoutAuditPanel(${r.request_id})">
            ตรวจนับ & ออกห้อง
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAuditsAndIncidents() {
  document.getElementById("statTotalRequests").textContent = db.REQUESTS.length;
  document.getElementById("statClosedRequests").textContent = db.REQUESTS.filter(r => r.status === "CLOSED").length;
  document.getElementById("statIncidents").textContent = db.REQUESTS.filter(r => r.status === "FLAGGED").length;

  const tbody = document.getElementById("checkoutAuditsTableBody");
  tbody.innerHTML = db.CHECKOUT_AUDITS.map(a => `
    <tr>
      <td><strong>AUD-${a.audit_id}</strong></td>
      <td>#REQ-${a.request_id}</td>
      <td>${db.USERS.find(u => u.user_id === a.checker_id)?.name || 'Gatekeeper'}</td>
      <td>
        ${a.audit_result === 'PASSED' ? 
          `<span class="badge badge-approved">PASSED</span>` : 
          `<span class="badge badge-flagged"> DISCREPANCY / FLAGGED</span>`}
      </td>
      <td>${a.remarks}</td>
      <td>${a.audit_time}</td>
    </tr>
  `).join("");
}

// ERD Live Inspector
function showErdTable(tableName) {
  selectedErdTable = tableName;
  document.querySelectorAll(".erd-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === tableName);
  });
  renderErdInspector();
}

function renderErdInspector() {
  document.getElementById("erdTableName").textContent = `TABLE: ${selectedErdTable}`;
  const data = db[selectedErdTable] || [];
  document.getElementById("erdTableCount").textContent = `${data.length} records`;

  const head = document.getElementById("erdInspectHead");
  const body = document.getElementById("erdInspectBody");

  if (data.length === 0) {
    head.innerHTML = `<tr><th>Information</th></tr>`;
    body.innerHTML = `<tr><td class="text-center">ไม่มีข้อมูลในตารางนี้</td></tr>`;
    return;
  }

  const keys = Object.keys(data[0]);
  head.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;
  body.innerHTML = data.map(row => `
    <tr>${keys.map(k => `<td>${JSON.stringify(row[k])}</td>`).join("")}</tr>
  `).join("");
}

// Request Code Modal
function showQrModal(reqId) {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.getElementById("qrModalTitle").textContent = `คำร้อง #REQ-${reqId}`;
  document.getElementById("qrVisualBox").textContent = `REQ-${reqId}`;
}

function closeQrModal() {
  document.getElementById("qrModal").classList.add("hidden");
}
