# เว็บแอปจองวันลา — Vercel + Supabase

แอป React/Vite แบบไม่ต้องล็อกอิน ทุกคนที่มีลิงก์สามารถดู เพิ่ม แก้ไข และลบรายการได้

## ฟีเจอร์
- ปฏิทินรายเดือน กดวันที่เพื่อเปิดแบบฟอร์มจอง
- ปุ่ม “คนทั่วไปใช้” สำหรับจองวันลา และปุ่ม “Admin JA” สำหรับเข้าโหมดจัดการรายชื่อด้วย PIN
- Admin เพิ่ม แก้ไข ปิดใช้งาน และลบรายชื่อพนักงานได้ (หากมีประวัติการลา ระบบอาจไม่อนุญาตให้ลบเพื่อรักษาข้อมูลเดิม)
- ประเภทเริ่มต้น: ลาป่วย, ลากิจ, ลาพักร้อน, ลาไม่รับค่าจ้าง, ลาคลอด, ลาเพื่อดูแลครอบครัว, ลาเพื่อรับราชการทหาร, ลาเพื่อฝึกอบรม, วันหยุดชดเชย, อื่น ๆ
- เพิ่มประเภทการลาใหม่ได้
- **เหตุผลการลาเป็นช่องบังคับ** และฐานข้อมูลปฏิเสธข้อความว่าง
- วันที่เริ่ม/สิ้นสุด, หมายเหตุ, ค้นหา, แก้ไขและลบรายการ
- รองรับมือถือและคอมพิวเตอร์

## ข้อจำกัดของ PIN Admin
PIN นี้เป็นเพียงการซ่อน/เปิดหน้าจัดการในฝั่งเว็บ เพราะตัวแปรที่ขึ้นต้นด้วย `VITE_` จะถูกส่งไปยังเบราว์เซอร์ ผู้ใช้ที่มีความรู้ทางเทคนิคอาจตรวจพบหรือข้ามการตรวจสอบได้ จึงไม่ใช่ระบบรักษาความปลอดภัยจริง หากใช้ข้อมูลพนักงานจริง ควรเปลี่ยนเป็น Supabase Auth พร้อมสิทธิ์ฝั่งฐานข้อมูล หรือ Edge Function ตรวจ PIN ฝั่งเซิร์ฟเวอร์

## คำเตือนด้านความปลอดภัย
ตามที่กำหนดให้ไม่ต้องล็อกอินและทุกคนที่มีลิงก์แก้ไขได้ จึงเปิด RLS policy ให้บทบาท `anon` อ่าน/เพิ่ม/แก้ไข/ลบข้อมูลได้ ผู้ที่เข้าถึงเว็บและ key สาธารณะสามารถเรียก API โดยตรงได้ และอาจลบ/แก้ไขข้อมูลคนอื่นได้ด้วย
- ห้ามใส่ `service_role`/secret key ในเว็บหรือ GitHub เด็ดขาด
- Publishable/anon key เป็น key สำหรับ client แต่ไม่ใช่ตัวควบคุมสิทธิ์แทน RLS
- อย่าใส่ข้อมูลสุขภาพหรือเหตุผลการลาที่ละเอียดอ่อน
- เวอร์ชันนี้ยังไม่จำกัดจำนวนคนลาต่อวัน ไม่ป้องกันจองซ้อน ไม่มีกระบวนการอนุมัติหรือคำนวณยอดสิทธิวันลาคงเหลือ

## 1) ตั้งค่า Supabase
1. สร้างโปรเจกต์ที่ https://supabase.com/
2. เปิด SQL Editor แล้ววางเนื้อหาทั้งหมดจาก `supabase/schema.sql` และกด Run
3. ไปที่ Project Settings / API หรือ Connect แล้วคัดลอก Project URL และ Publishable key หรือ anon key
4. อย่าใช้ `service_role` key ในเว็บเด็ดขาด

## 2) รันในเครื่อง
ติดตั้ง Node.js LTS จาก https://nodejs.org/
แตก ZIP แล้วเปิด Terminal ในโฟลเดอร์โปรเจกต์:
```bash
npm install
```
คัดลอก `.env.example` เป็น `.env.local` และใส่ค่าจริง:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_ADMIN_PIN=ตั้ง_PIN_ของคุณ
```
จากนั้น:
```bash
npm run dev
```
เปิด `http://localhost:5173`.

## 3) ฝากโค้ดไว้ที่ GitHub
GitHub ใช้เก็บโค้ดและประวัติการแก้ไข ส่วนข้อมูลการลาจริงเก็บใน Supabase
1. สร้าง repository ใหม่ที่ https://github.com/
2. อัปโหลดไฟล์โปรเจกต์ที่แตก ZIP แล้ว หรือใช้คำสั่ง:
```bash
git init
git add .
git commit -m "Initial leave booking app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shared-leave-booking.git
git push -u origin main
```
แทน `YOUR_USERNAME` ด้วยชื่อบัญชี GitHub ห้ามอัปโหลด `.env.local` (มี `.gitignore` ให้แล้ว)

## 4) Deploy บน Vercel
1. ไปที่ https://vercel.com/ แล้ว Sign up with GitHub
2. Add New → Project → Import repository
3. Build command `npm run build`, Output directory `dist`
4. Project Settings → Environment Variables เพิ่ม:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PIN` (ตั้ง PIN สำหรับปุ่ม Admin JA)
5. Deploy แล้วแชร์ URL ที่ Vercel สร้างให้
6. เมื่อแก้ Environment Variables ให้ Redeploy ใหม่

## 5) วิธีใช้
1. กด “Admin JA” แล้วกรอก PIN เพื่อเปิดหน้าจัดการรายชื่อ หรือกด “คนทั่วไปใช้” เพื่อเข้าหน้าจองวันลา
2. ในโหมด Admin สามารถเพิ่ม แก้ไข ปิดใช้งาน และลบรายชื่อได้; ผู้ใช้ทั่วไปคลิกวันที่ในปฏิทิน หรือปุ่ม “คนทั่วไปใช้”
3. เลือกพนักงาน ประเภทการลา และวันที่เริ่ม/สิ้นสุด
4. กรอก **เหตุผลการลา** ก่อนบันทึก หากเว้นว่าง ระบบไม่ให้บันทึก
5. กด “ยืนยันจองวันลา”; รายการจะแสดงให้ทุกคนที่เปิดเว็บเห็น
6. คลิกแถบรายการลาเพื่อแก้ไข ใช้ปุ่มถังขยะเพื่อลบ
7. ประเภท “วันหยุดชดเชย” ใช้บันทึกวันหยุดชดเชยและกรอกเหตุผล เช่น ทำงานในวันหยุดวันที่...

## โครงสร้าง
```text
leave-booking-app/
├── src/main.jsx
├── src/styles.css
├── supabase/schema.sql
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── README.md
```
