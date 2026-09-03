/* ===================================================
   Data Center Access & Equipment Tracking System - Supabase Engine
   =================================================== */

const SUPABASE_URL = 'https://cbdoskkkrpzcutzvcjzh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_drjCU5YC1EyKisnonx5uCA_DB085tdZ';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const SESSION_KEY = "DC_ACCESS_CURRENT_USER_V2";

let db = {
  users: [],
  requests: [],
  visitors: [],
  equipments: [],
  approvals: [],
  access_logs: [],
  checkout_audits: []
};

let currentUser = null;
let currentTab = "create-request";
let selectedErdTable = "users";
let isRegisterMode = false;

function showToast(message) {
  const toast = document.getElementById("toast-notification");
  const msgEl = document.getElementById("toast-message");
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => { toast.classList.add("hidden"); }, 3000);
}

// โหลดข้อมูลทั้งหมดจากตารางพิมพ์เล็กใน Supabase
async function loadDatabaseFromSupabase() {
  try {
    const [usersRes, reqsRes, visRes, eqRes, appRes, logsRes, auditsRes] = await Promise.all([
      _supabase.from('users').select('*'),
      _supabase.from('requests').select('*'),
      _supabase.from('visitors').select('*'),
      _supabase.from('equipments').select('*'),
      _supabase.from('approvals').select('*'),
      _supabase.from('access_logs').select('*'),
      _supabase.from('checkout_audits').select('*')
    ]);

    db.users = usersRes.data || [];
    db.requests = reqsRes.data || [];
    db.visitors = visRes.data || [];
    db.equipments = eqRes.data || [];
    db.approvals = appRes.data || [];
    db.access_logs = logsRes.data || [];
    db.checkout_audits = auditsRes.data || [];

    console.log("Database synced from Supabase successfully!");
  } catch (err) {
    console.error("Error loading from Supabase:", err);
  }
}

async function resetDemoData() {
  alert("ระบบใช้งานฐานข้อมูล Supabase บนคลาวด์แล้ว ข้อมูลจะถูกจัดการผ่านตารางออนไลน์จริง");
}

document.addEventListener("DOMContentLoaded", async () => {
  renderVisitorInputRows();
  renderEquipmentInputRows();

  await loadDatabaseFromSupabase();

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

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  
  const titleEl = document.getElementById("authFormTitle");
  const subtitleEl = document.getElementById("authFormSubtitle");
  const btnEl = document.getElementById("authSubmitBtn");
  const toggleTextEl = document.getElementById("authToggleText");
  const nameGroup = document.getElementById("registerNameGroup");
  const deptGroup = document.getElementById("registerDeptGroup");
  
  if (isRegisterMode) {
    titleEl.textContent = "สมัครสมาชิกใหม่";
    subtitleEl.textContent = "ลงทะเบียนเพื่อขอสิทธิ์ใช้งานระบบ Data Center";
    btnEl.textContent = "ลงทะเบียน (Register)";
    nameGroup.classList.remove("hidden");
    deptGroup.classList.remove("hidden");
    toggleTextEl.innerHTML = `มีบัญชีอยู่แล้ว? <a href="javascript:void(0);" onclick="toggleAuthMode()" class="text-cyan" style="font-weight: 600; text-decoration: underline;">เข้าสู่ระบบที่นี่</a>`;
  } else {
    titleEl.textContent = "เข้าสู่ระบบ";
    subtitleEl.textContent = "BPH DATA CENTER - ระบบตรวจสอบและจัดการการเข้าห้อง";
    btnEl.textContent = "เข้าสู่ระบบ (Log In)";
    nameGroup.classList.add("hidden");
    deptGroup.classList.add("hidden");
    toggleTextEl.innerHTML = `ยังไม่มีบัญชีผู้ใช้งาน? <a href="javascript:void(0);" onclick="toggleAuthMode()" class="text-cyan" style="font-weight: 600; text-decoration: underline;">สมัครสมาชิกที่นี่</a>`;
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  if (isRegisterMode) {
    const name = document.getElementById("registerName").value.trim();
    const dept = document.getElementById("registerDept").value.trim();

    if (!name || !dept) {
      alert("❌ กรุณากรอกชื่อและแผนก/บริษัทให้ครบถ้วน");
      return;
    }

    try {
      const { data: existingUser } = await _supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        alert("❌ อีเมลนี้ถูกใช้งานในระบบแล้ว โปรดใช้อีเมลอื่นหรือเข้าสู่ระบบ");
        return;
      }

      const { data: newUser, error: insertError } = await _supabase
        .from('users')
        .insert([
          { email: email, password: pass, name: name, department: dept, role: "REQUESTER" }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      await loadDatabaseFromSupabase();
      showToast("🎉 สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...");
      currentUser = newUser;
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch(e) {}
      applyUserSession(currentUser);

    } catch (err) {
      console.error("Register Error:", err);
      alert("❌ เกิดข้อผิดพลาดในการสมัครสมาชิก: " + err.message);
    }

  } else {
    try {
      const { data: foundUser, error } = await _supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .maybeSingle();

      if (error) throw error;

      if (foundUser) {
        currentUser = foundUser;
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch(e) {}
        applyUserSession(currentUser);
        showToast(`🔓 ยินดีต้อนรับคุณ ${currentUser.name} (${currentUser.role})`);
      } else {
        alert("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง!");
      }

    } catch (err) {
      console.error("Login Error:", err);
      alert("❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้: " + err.message);
    }
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
  isRegisterMode = false;
  document.getElementById("authForm").reset();
  const nameGroup = document.getElementById("registerNameGroup");
  const deptGroup = document.getElementById("registerDeptGroup");
  if(nameGroup) nameGroup.classList.add("hidden");
  if(deptGroup) deptGroup.classList.add("hidden");
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

async function switchTab(tabId) {
  currentTab = tabId;
  await loadDatabaseFromSupabase();

  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add("active");

  const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (targetNav) targetNav.classList.add("active");

  updateUI();
}

function renderVisitorInputRows() {
  const tbody = document.getElementById("visitorsTableBody");
  if(!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td><input type="text" class="v-name" required placeholder="ชื่อ-นามสกุล"></td>
      <td><input type="text" class="v-id" required placeholder="รหัสพนักงาน/บัตรประชาชน"></td>
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
  if(!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td><input type="text" class="e-name" required placeholder="ชื่ออุปกรณ์ และ Serial Number"></td>
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

async function handleCreateRequest(e) {
  e.preventDefault();

  const category = document.getElementById("reqPurposeCategory").value;
  const detail = document.getElementById("reqPurposeDetail").value;
  const timeframe = document.getElementById("reqTimeframe").value;

  try {
    const { data: newReq, error: reqErr } = await _supabase
      .from('requests')
      .insert([{
        requester_id: currentUser ? currentUser.user_id : 101,
        purpose: `${detail} (${category})`,
        purpose_category: category,
        status: "PENDING",
        timeframe: timeframe
      }])
      .select()
      .single();

    if (reqErr) throw reqErr;
    const newReqId = newReq.request_id;

    const visitorRows = [];
    document.querySelectorAll("#visitorsTableBody tr").forEach(r => {
      const name = r.querySelector(".v-name").value;
      const empId = r.querySelector(".v-id").value;
      if (name) {
        visitorRows.push({ request_id: newReqId, visitor_name: name, employee_id: empId });
      }
    });
    if (visitorRows.length > 0) {
      await _supabase.from('visitors').insert(visitorRows);
    }

    const equipRows = [];
    document.querySelectorAll("#equipmentsTableBody tr").forEach(r => {
      const itemName = r.querySelector(".e-name").value;
      const qty = parseInt(r.querySelector(".e-qty").value) || 1;
      if (itemName) {
        equipRows.push({ request_id: newReqId, item_name: itemName, quantity_in: qty, quantity_out: 0, status: "WAITING_ENTRY" });
      }
    });
    if (equipRows.length > 0) {
      await _supabase.from('equipments').insert(equipRows);
    }

    await loadDatabaseFromSupabase();
    alert(`ส่งคำร้องขออนุมัติเรียบร้อยแล้ว! รหัสคำร้องคือ #REQ-${newReqId}`);
    switchTab("my-requests");

  } catch (err) {
    console.error("Create Request Error:", err);
    alert("❌ ไม่สามารถส่งคำร้องได้: " + err.message);
  }
}

async function approveRequest(reqId) {
  try {
    await _supabase.from('requests').update({ status: "APPROVED" }).eq('request_id', reqId);
    await _supabase.from('approvals').insert([{
      request_id: reqId,
      approver_id: currentUser ? currentUser.user_id : 102,
      role_type: "IT Supervisor",
      decision: "APPROVED",
      remark: "อนุมัติรายการเรียบร้อย"
    }]);

    await loadDatabaseFromSupabase();
    alert(`อนุมัติคำร้อง #REQ-${reqId} เรียบร้อยแล้ว!`);
    updateUI();
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาด: " + err.message);
  }
}

async function rejectRequest(reqId) {
  const reason = prompt("ระบุเหตุผลในการไม่อนุมัติ:") || "ไม่อนุมัติเนื่องจากข้อมูลไม่ครบถ้วน";
  try {
    await _supabase.from('requests').update({ status: "REJECTED" }).eq('request_id', reqId);
    await _supabase.from('approvals').insert([{
      request_id: reqId,
      approver_id: currentUser ? currentUser.user_id : 102,
      role_type: "IT Supervisor",
      decision: "REJECTED",
      remark: reason
    }]);

    await loadDatabaseFromSupabase();
    alert(`ปฏิเสธคำร้อง #REQ-${reqId} เรียบร้อยแล้ว`);
    updateUI();
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาด: " + err.message);
  }
}

function parseRequestId(inputVal) {
  if (!inputVal) return null;
  const cleanStr = String(inputVal).replace(/[^0-9]/g, "");
  return parseInt(cleanStr) || null;
}

async function processScanInByCode() {
  const val = document.getElementById("manualCodeInput").value || document.getElementById("quickSelectScanRequest").value;
  const reqId = parseRequestId(val);

  if (!reqId) return alert("โปรดป้อนรหัสคำร้อง เช่น REQ-1001 หรือ 1001");

  const req = db.requests.find(r => r.request_id === reqId);
  if (!req) return alert(`ไม่พบรหัสคำร้อง #REQ-${reqId} ในระบบ!`);

  if (req.status === "PENDING") return alert(`คำร้อง #REQ-${reqId} ยังอยู่ในสถานะรอหัวหน้าอนุมัติ`);
  if (req.status === "CHECKED_IN") return alert(`คำร้อง #REQ-${reqId} สแกนเข้าห้องไปแล้วเรียบร้อย`);

  try {
    await _supabase.from('requests').update({ status: "CHECKED_IN" }).eq('request_id', reqId);
    await _supabase.from('access_logs').insert([{
      request_id: reqId,
      entry_time: new Date().toLocaleTimeString("th-TH"),
      exit_time: null
    }]);
    await _supabase.from('equipments').update({ status: "INSIDE_DC" }).eq('request_id', reqId);

    await loadDatabaseFromSupabase();
    document.getElementById("manualCodeInput").value = "";
    alert(`สแกนรหัส #REQ-${reqId} สำเร็จ! ต้อนรับผู้ปฏิบัติงานเข้าห้อง Data Center`);
    updateUI();
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาด: " + err.message);
  }
}

function processScanOutByCode() {
  const val = document.getElementById("manualCodeInput").value || document.getElementById("quickSelectScanRequest").value;
  const reqId = parseRequestId(val);

  if (!reqId) return alert("โปรดป้อนรหัสคำร้อง เช่น REQ-1001 หรือ 1001");

  const req = db.requests.find(r => r.request_id === reqId);
  if (!req) return alert(`ไม่พบรหัสคำร้อง #REQ-${reqId} ในระบบ!`);
  if (req.status !== "CHECKED_IN") return alert(`คำร้อง #REQ-${reqId} ไม่ได้อยู่ในสถานะกำลังปฏิบัติงาน`);

  openCheckoutAuditPanel(reqId);
}

function openCheckoutAuditPanel(reqId) {
  const req = db.requests.find(r => r.request_id === reqId);
  if (!req || req.status !== "CHECKED_IN") return alert("คำร้องนี้ไม่ได้อยู่ในสถานะกำลังปฏิบัติงาน");

  const panel = document.getElementById("checkoutAuditPanel");
  panel.classList.remove("hidden");
  document.getElementById("auditRequestId").value = reqId;

  document.getElementById("auditRequestSummary").innerHTML = `
    <strong>คำร้อง #REQ-${reqId}:</strong> ${req.purpose} | ผู้ขอ: ${db.users.find(u => u.user_id === req.requester_id)?.name || 'N/A'}
  `;

  const tbody = document.getElementById("auditEquipmentsTableBody");
  const equips = db.equipments.filter(e => e.request_id === reqId);

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

async function handleSaveExitAudit(e) {
  e.preventDefault();

  const reqId = parseInt(document.getElementById("auditRequestId").value);
  const req = db.requests.find(r => r.request_id === reqId);
  const remarks = document.getElementById("auditRemarks").value;
  const condCheck = document.getElementById("conditionalAuditCheck").value;

  let hasDiscrepancy = false;

  try {
    for (const r of document.querySelectorAll("#auditEquipmentsTableBody tr")) {
      const input = r.querySelector(".audit-qty-out");
      const equipId = parseInt(input.getAttribute("data-equip-id"));
      const qtyOut = parseInt(input.value) || 0;
      const status = r.querySelector(".audit-equip-status").value;

      const eq = db.equipments.find(e => e.equip_id === equipId);
      if (eq) {
        if (qtyOut !== eq.quantity_in && status !== "LEFT_INSIDE") {
          hasDiscrepancy = true;
        }
        await _supabase.from('equipments').update({ quantity_out: qtyOut, status: status }).eq('equip_id', equipId);
      }
    }

    if (req.purpose_category !== "GENERAL_SERVICE" && condCheck === "FAILED") {
      hasDiscrepancy = true;
    }

    const accessLog = db.access_logs.find(l => l.request_id === reqId && !l.exit_time);
    if (accessLog) {
      await _supabase.from('access_logs').update({ exit_time: new Date().toLocaleTimeString("th-TH") }).eq('log_id', accessLog.log_id);
    }

    const auditResult = hasDiscrepancy ? "DISCREPANCY_FLAGGED" : "PASSED";
    await _supabase.from('checkout_audits').insert([{
      request_id: reqId,
      checker_id: currentUser ? currentUser.user_id : 103,
      audit_result: auditResult,
      remarks: remarks || (hasDiscrepancy ? "พบอุปกรณ์ไม่ครบถ้วนตามรายการแจ้งเข้า" : "ตรวจสอบอุปกรณ์และเวลาออกเรียบร้อย"),
      audit_time: new Date().toLocaleString("th-TH")
    }]);

    const finalStatus = hasDiscrepancy ? "FLAGGED" : "CLOSED";
    await _supabase.from('requests').update({ status: finalStatus }).eq('request_id', reqId);

    await loadDatabaseFromSupabase();
    hideAuditPanel();

    if (hasDiscrepancy) {
      alert(`คำร้อง #REQ-${reqId} ถูกบันทึกเป็นเหตุการณ์ผิดปกติ (FLAGGED)!`);
    } else {
      alert(`การตรวจสอบเสร็จสิ้น! ปิดคำร้อง #REQ-${reqId} สมบูรณ์`);
    }

    updateUI();
  } catch (err) {
    alert("❌ เกิดข้อผิดพลาด: " + err.message);
  }
}

function updateUI() {
  renderMyRequests();
  renderApprovals();
  renderGatekeeperTerminal();
  renderAuditsAndIncidents();
  renderErdInspector();

  const myReqsCountEl = document.getElementById("myRequestsCount");
  const pendingCountEl = document.getElementById("pendingApprovalCount");
  if(myReqsCountEl) myReqsCountEl.textContent = db.requests.length;
  if(pendingCountEl) pendingCountEl.textContent = db.requests.filter(r => r.status === "PENDING").length;
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
  if(!tbody) return;
  tbody.innerHTML = db.requests.map(r => {
    const user = db.users.find(u => u.user_id === r.requester_id);
    return `
      <tr>
        <td><strong>#REQ-${r.request_id}</strong></td>
        <td>${user ? user.name : 'Unknown'}<br><span class="text-sm">${user ? user.department : ''}</span></td>
        <td>${r.purpose}</td>
        <td><span class="badge badge-info">${r.purpose_category}</span></td>
        <td>${getStatusBadge(r.status)}</td>
        <td>${r.created_at || '-'}</td>
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
  if(!tbody) return;
  const pendings = db.requests.filter(r => r.status === "PENDING");

  if (pendings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-sm">ไม่มีรายการคำร้องที่รอการอนุมัติในขณะนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = pendings.map(r => {
    const user = db.users.find(u => u.user_id === r.requester_id);
    const visitors = db.visitors.filter(v => v.request_id === r.request_id);
    const equips = db.equipments.filter(e => e.request_id === r.request_id);

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
  if(!select) return;
  const approvedOrInside = db.requests.filter(r => r.status === "APPROVED" || r.status === "CHECKED_IN");

  select.innerHTML = `<option value="">-- เลือกจากรายการที่อนุมัติแล้ว --</option>` + 
    approvedOrInside.map(r => `<option value="REQ-${r.request_id}">#REQ-${r.request_id} [${r.status}] - ${r.purpose.substring(0, 25)}...</option>`).join("");

  const tbody = document.getElementById("insideRoomTableBody");
  const insiders = db.requests.filter(r => r.status === "CHECKED_IN");

  if (insiders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-sm">ขณะนี้ไม่มีบุคคลอยู่ภายในห้อง Data Center</td></tr>`;
    return;
  }

  tbody.innerHTML = insiders.map(r => {
    const user = db.users.find(u => u.user_id === r.requester_id);
    const log = db.access_logs.find(l => l.request_id === r.request_id && !l.exit_time);
    const equips = db.equipments.filter(e => e.request_id === r.request_id);

    return `
      <tr>
        <td><strong>#REQ-${r.request_id}</strong></td>
        <td>${user ? user.name : ''}</td>
        <td><span class="text-cyan">${log ? log.entry_time : '-'}</span></td>
        <td>${equips.length} รายการ</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="openCheckoutAuditPanel(${r.request_id})">ตรวจนับ & ออกห้อง</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAuditsAndIncidents() {
  const totalReqEl = document.getElementById("statTotalRequests");
  const closedReqEl = document.getElementById("statClosedRequests");
  const incidentsEl = document.getElementById("statIncidents");
  if(totalReqEl) totalReqEl.textContent = db.requests.length;
  if(closedReqEl) closedReqEl.textContent = db.requests.filter(r => r.status === "CLOSED").length;
  if(incidentsEl) incidentsEl.textContent = db.requests.filter(r => r.status === "FLAGGED").length;

  const tbody = document.getElementById("checkoutAuditsTableBody");
  if(!tbody) return;
  tbody.innerHTML = db.checkout_audits.map(a => `
    <tr>
      <td><strong>AUD-${a.audit_id}</strong></td>
      <td>#REQ-${a.request_id}</td>
      <td>${db.users.find(u => u.user_id === a.checker_id)?.name || 'Gatekeeper'}</td>
      <td>
        ${a.audit_result === 'PASSED' ? 
          `<span class="badge badge-approved">PASSED</span>` : 
          `<span class="badge badge-flagged">DISCREPANCY / FLAGGED</span>`}
      </td>
      <td>${a.remarks}</td>
      <td>${a.audit_time}</td>
    </tr>
  `).join("");
}

function showErdTable(tableName) {
  selectedErdTable = tableName;
  document.querySelectorAll(".erd-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.toLowerCase() === tableName.toLowerCase());
  });
  renderErdInspector();
}

function renderErdInspector() {
  const tableNameEl = document.getElementById("erdTableName");
  if(!tableNameEl) return;
  tableNameEl.textContent = `TABLE: ${selectedErdTable.toUpperCase()}`;
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

function showQrModal(reqId) {
  const modal = document.getElementById("qrModal");
  modal.classList.remove("hidden");
  document.getElementById("qrModalTitle").textContent = `คำร้อง #REQ-${reqId}`;
  document.getElementById("qrVisualBox").textContent = `REQ-${reqId}`;
}

function closeQrModal() {
  document.getElementById("qrModal").classList.add("hidden");
}