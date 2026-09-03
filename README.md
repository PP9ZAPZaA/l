# Data Center Access & Equipment Tracking Management System

ระบบเว็บแอปพลิเคชันบริหารจัดการและติดตามการยื่นขอเข้าห้อง Data Center และการนำอุปกรณ์เข้า-ออก ตามขั้นตอน Flowchart และ ERD Schema

---

## 📁 โครงสร้างโปรเจกต์ (Project Files)

- `index.html` : โครงสร้างหน้าเว็บ Semantic HTML5 แบ่งส่วน Navigation, Form, Tables, Modal และ Live ERD Inspector
- `style.css` : ระบบ Styling รูปแบบ Dark Glassmorphism พร้อม CSS Variables, Responsive Tables และ Animations
- `app.js` : Engine ประมวลผล Workflow ตาม Flowchart และจัดการข้อมูล 7 ตารางตาม ERD (`USERS`, `REQUESTS`, `VISITORS`, `EQUIPMENTS`, `APPROVALS`, `ACCESS_LOGS`, `CHECKOUT_AUDITS`)
- `package.json` : สคริปต์สำหรับการรันด้วย Node.js / serve

---

## 🚀 วิธีการเปิดใช้งานใน Visual Studio Code

### วิธีที่ 1: เปิดผ่านส่วนขยาย Live Server ใน VS Code (แนะนำ)
1. เปิดโฟลเดอร์โปรเจกต์ `C:\Users\bph.itsupport\.gemini\antigravity\scratch\datacenter-access-system` ใน **VS Code**
2. คลิกขวาที่ไฟล์ `index.html` แล้วเลือก **"Open with Live Server"**
3. หน้าเว็บจะเปิดขึ้นมาใน Web Browser ทันที

### วิธีที่ 2: รันผ่าน Terminal (npm)
1. เปิด Terminal ใน VS Code (`Ctrl + ~`)
2. พิมพ์คำสั่ง:
   ```bash
   npm start
   ```
3. เปิดเบราว์เซอร์ไปที่ URL ที่แสดงใน Terminal (เช่น `http://localhost:3000`)

---

## 🌟 ส่วนสำคัญเพิ่มเติมที่เพิ่มขึ้นมา (Key Features & Highlights)

1. **Multi-Role Switcher (ตัวสลับบทบาท 4 ฝ่าย):**
   - ให้คุณสามารถสลับทดสอบมุมมอง 4 บทบาทได้จากเมูด้านบน:
     - 👤 **Requester:** ยื่นขอเข้าห้อง เพิ่มผู้ปฏิบัติงาน และรายการอุปกรณ์
     - 👔 **IT Supervisor:** ตรวจสอบและอนุมัติคำร้อง
     - 🛡️ **Gatekeeper:** สแกน QR Code เข้า-ออกห้อง และทำ Exit Equipment Audit
     - 📊 **Auditor:** ดูสรุปเหตุการณ์ผิดปกติและ Log ทั้งหมด
2. **Smart Equipment Audit & Discrepancy Flagging:**
   - ระบบเปรียบเทียบจำนวนอุปกรณ์ขาเข้า (`quantity_in`) vs ขาออก (`quantity_out`) อัตโนมัติ หากไม่ตรงกัน ระบบจะเปลี่ยนสถานะเป็น `FLAGGED` และบันทึกเข้าประวัติความผิดปกติ
3. **QR Code Simulator:**
   - ปุ่มสร้างและสแกน QR Code สำหรับลงเวลาเข้า (`entry_time`) และเวลาออก (`exit_time`) ในตาราง `ACCESS_LOGS`
4. **Conditional Sensitivity Classifier:**
   - คัดกรองคำร้องกรณีมีการ ลบ/สำเนา/รีเซ็ต หรือกักเก็บอุปกรณ์ เพื่อเพิ่มด่านตรวจเช็คพิเศษตาม Flowchart
5. **Real-time ERD Inspector:**
   - แท็บสำหรับคลิกดูข้อมูลในตาราง ERD ทั้ง 7 ตารางแบบเรียลไทม์เมื่อมีการทำรายการ
