MRT QuickPass — แผนการสร้าง Functional Prototype

Spec ที่ส่งมามีขนาดใหญ่มาก (38 หมวด, ~15+ routes, Supabase auth, interactive Leaflet map, i18n, payment flow, dynamic QR, group ticket, admin dashboard, tests, ฯลฯ). ถ้าจะทำครบทุกข้อในรอบเดียวจะใช้เวลาหลายวันและมีความเสี่ยงสูงที่หลาย feature จะเป็นแค่ shell. ผมเสนอทำเป็น **หลาย phase** โดยแต่ละ phase จบแล้วใช้งานได้จริงและต่อยอดได้

## สถานะปัจจุบัน

โปรเจกต์ยังเป็น template เปล่า (`src/routes/index.tsx` เป็น placeholder). ไม่มี MRT QuickPass code เดิม → เริ่มจากศูนย์

## Phase 1 — Foundation + Core Journey (รอบนี้)

เป้าหมาย: กรรมการทดลอง flow หลัก **ค้นหา → เลือกสถานี → ดูเส้นทาง+ค่าโดยสาร → ชำระ Demo → รับ Dynamic QR → Scan In/Out** ได้ครบด้วยตัวเอง แบบ **Local Demo Mode ไม่ต้องพึ่ง Supabase**

รวมใน Phase นี้:

1. **Design system + branding** — สี Navy/MRT Blue/Purple/Yellow/Pink, IBM Plex Sans Thai, tokens ใน `styles.css`, `MrtBrandLogo` component
2. **App Shell** — Sidebar (desktop) + Bottom Nav (mobile) + PageHeader + EnvironmentBanner + DemoDisclaimer
3. **Routes ครบ 20+ routes** — ทุก route เปิดได้ (บาง route ใน phase หลังจะเป็น functional stub ที่บอกว่า “มาใน Phase ถัดไป” อย่างชัดเจน ไม่ใช่ Coming Soon หลอก)
4. **Data layer** — JSON datasets: `mrt-lines`, `mrt-stations` (Blue/Purple/Yellow/Pink พร้อมพิกัดจริง + source metadata), `mrt-interchanges`, `mrt-fares`, `mrt-station-exits` (curated subset), `future-network`, `queue-demo`, `nearby-places`, `source-manifest`
5. **i18n** — react-i18next (th/en) + LanguageSwitcher, key ครบทุก UI string ใน Phase 1
6. **Interactive Map** (`/map`) — React Leaflet + OpenStreetMap + polylines สีตามสาย + station markers คลิกได้ + Future Network เส้นประ + Legend + Attribution + line toggles + set origin/destination
7. **Search** (`/search`) — ค้นหา local dataset ก่อน (สถานี+places), Nominatim optional fallback with debounce/cache/error state
8. **Route Planner** (`/route`) — Dijkstra บน station graph → fastest/fewest transfers/least walking + Vertical Timeline + fare + suggested exit
9. **Fare Engine** — คำนวณจริงจาก fare table (band-based) + source metadata + “ค่าโดยสารโดยประมาณ” label + unavailable fallback
10. **Smart Exit Guide** — ranking algorithm + confidence + data source badge (จำกัดสถานีที่ curated เท่านั้น)
11. **Local Demo Storage** — Repository pattern (IndexedDB/LocalStorage) สำหรับ tickets, saved_trips, transactions, support_requests, profile settings
12. **Checkout** (`/checkout`) — Payment method selector + MockPaymentProvider + pending→paid/failed + Demo Disclaimer
13. **Dynamic QR Ticket** (`/ticket/:id`) — qrcode.react + token rotate ทุก 20s (payload `{ticketId, issuedAt, expiresAt, nonce}`) + countdown + Scan In/Out simulation + status transitions + Disclaimer
14. **My Tickets** (`/tickets`) — filter by status + empty state + open QR
15. **Saved Trips + One-Tap Repeat** (`/trips`) — CRUD + repeat → prefilled checkout
16. **Group Ticket** (`/family`) — 1–6 คน, QR แยกต่อคน, Group Entry Mode next/prev
17. **Queue Monitor** (`/queue`) — station cards + status + Recharts trend + filter + Demo disclaimer
18. **Admin Demo Dashboard** (`/admin-demo`) — Zustand shared state → /queue อัปเดตทันที
19. **Accessibility** (`/accessibility`) — font size, high contrast, reduce motion (จริง กระทบทั้งแอป)
20. **Help + Support** (`/help`) — FAQ accordion + support request form ที่บันทึกจริง + reference code
21. **Data Sources** (`/data-sources`) — แสดงทุก dataset + source + วันที่ + confidence
22. **Loading/Empty/Error/Retry** ทุกหน้า
23. **Home** (`/`) — welcome + search card + nearby (geolocation) + ready ticket + saved trips + queue alert
24. **404 + Error Boundary**
25. **README ภาษาไทย**

## Phase 2 (ยังไม่ทำในรอบนี้)

- **Lovable Cloud (Supabase)** — auth (email/pw + Google + magic link + forgot password), tables, RLS policies, migration; repository จะสลับจาก Local → Supabase อัตโนมัติ. ถ้าคุณอยาก enable Cloud ตอนนี้บอกได้เลย ผมจะเพิ่มเข้า Phase 1
- Overpass API integration (ตอนนี้ Nominatim เพียงพอ)
- Payment provider จริง (Opn/Omise) — ตอนนี้ mock พอ
- ภาษา zh/ja (โครง key เตรียมไว้แล้ว)
- Playwright E2E tests (จะเพิ่ม test checklist manual แทนใน Phase 1)

## เทคนิค / Constraint สำคัญที่ยึด

- TanStack Start + file-based routing (`src/routes/`)
- ทุก route: loading + error + notFound components
- Framer Motion แบบ subtle เท่านั้น เคารพ Reduce Motion
- ห้าม Google Maps / API key บังคับ → ใช้ OpenStreetMap
- ห้าม fare สุ่ม / exit เดา → มี “unavailable” state
- ไม่มี “Coming Soon” หลอก — feature ยังไม่พร้อมต้อง disabled พร้อมเหตุผลจริง
- Future lines: แสดงได้แต่ block ออกจาก checkout/fare flow

## คำถาม 2 ข้อก่อนเริ่ม

1. **Lovable Cloud (Supabase)** — เปิดเลยใน Phase 1 (auth + persistent data ข้ามอุปกรณ์) หรือเริ่มด้วย Local Demo Mode ก่อน แล้วค่อยเพิ่ม Cloud ทีหลัง? Local Mode พร้อมกว่าและกรรมการทดสอบได้ทันทีไม่ต้องสมัครสมาชิก
2. **ขอบเขต station data** — ใส่ **สถานีจริงครบทุกสถานี** ของ Blue/Purple/Yellow/Pink (100+ สถานี พิมพ์ด้วยมือใช้เวลานาน) หรือใส่ **subset ที่ representative** (30-40 สถานีสำคัญ + interchange ครบ) เพื่อให้ Phase 1 เสร็จเร็ว แล้ว Phase 2 ค่อยเติม? ทั้งสองแบบมี source metadata ครบ

ตอบสองข้อนี้แล้วผมเริ่ม Phase 1 ทันที

Approve Phase 1 ครับ แต่ขอปรับเงื่อนไขให้ชัดเจนตามเป้าหมาย Functional Prototype ดังนี้

**1) เริ่มด้วย Local Demo Mode ใน Phase 1**

ให้เริ่มด้วย Local Demo Mode ก่อน เพื่อให้กรรมการสามารถเปิดและทดลอง Flow หลักได้ทันทีโดยไม่ต้องสมัครสมาชิกและไม่ต้องรอการตั้งค่า Supabase

แต่ต้องออกแบบ Repository Pattern ตั้งแต่แรก เพื่อให้ Phase 2 สามารถสลับจาก Local Storage / IndexedDB ไป Supabase ได้โดยไม่ต้องรื้อ Logic หลัก

Local Demo Mode ต้องรองรับการทำงานจริงของ:

- Tickets
- Payment Transactions
- Saved Trips
- Profile Settings
- Accessibility Settings
- Support Requests
- Queue Demo Data
- Recent Searches
- Guest Session ID

ให้มี Environment Banner ชัดเจนว่า:

Local Demo Mode — ข้อมูลถูกเก็บไว้ในอุปกรณ์นี้สำหรับการสาธิต

Phase 2 ค่อยเพิ่ม Supabase Authentication, Cloud Sync, Google Sign In, Magic Link และ RLS ได้

**2) ต้องใส่สถานีจริงครบทุกสถานีของ 4 สายตั้งแต่ Phase 1**

ไม่อนุมัติให้ใช้เพียง subset 30–40 สถานีสำหรับแผนที่และ Route Engine

Phase 1 ต้องมีข้อมูลสถานีจริงครบทุกสถานีที่เปิดให้บริการของ:

- MRT Blue Line
- MRT Purple Line
- MRT Yellow Line
- MRT Pink Line

ข้อมูลขั้นต่ำต่อสถานีต้องมี:

- Station ID
- Station Code
- ชื่อภาษาไทย
- ชื่อภาษาอังกฤษ
- Line ID
- ลำดับสถานี
- Latitude / Longitude
- สถานะเปิดให้บริการ
- สถานีเชื่อมต่อ
- Accessibility หากมีข้อมูล
- Data Source Metadata
- วันที่ตรวจสอบล่าสุด

ห้ามพิมพ์ข้อมูลด้วยมือแบบไม่มีระบบ ให้สร้าง Data Ingestion / Data Validation Script และ Curated Local Dataset จากข้อมูลสาธารณะและ Open Source ที่ตรวจสอบที่มาได้

ต้องมีการตรวจสอบ Dataset อัตโนมัติว่า:

- ไม่มี Station ID ซ้ำ
- ทุกสถานีมีพิกัด
- ทุกสถานีมีชื่อไทยและอังกฤษ
- ทุกสายมีรายชื่อสถานีครบ
- Station ที่อยู่ใน Route Graph ต้องมีอยู่ใน Dataset จริง
- Interchange ต้องอ้างอิง Station ID ที่มีจริง
- Future Network ต้องไม่เข้าสู่ Fare หรือ Checkout Flow

สำหรับข้อมูลทางออกและ Smart Exit Guide อนุญาตให้เริ่มจาก Curated Subset ของสถานีสำคัญได้ แต่หากสถานีใดยังไม่มีข้อมูลทางออกที่ตรวจสอบได้ ต้องแสดงสถานะ ยังไม่มีข้อมูลทางออกที่ตรวจสอบได้ และห้ามเดาหมายเลขทางออก

**3) ห้ามมี Functional Stub สำหรับฟังก์ชันหลัก**

ไม่ต้องสร้างทุก Route ของ Phase 2 ตั้งแต่ตอนนี้ หากยังไม่ทำงานจริง

ห้ามใช้หน้า placeholder, shell, หรือข้อความ “มาใน Phase ถัดไป” สำหรับฟังก์ชันหลัก เพราะจะทำให้ Prototype ดูเหมือนยังทำไม่เสร็จ

ให้ทำเฉพาะ Routes ใน Phase 1 ที่ใช้งานได้จริงครบ Flow ก่อน ได้แก่:

- /
- /search
- /map
- /route
- /checkout
- /ticket/:ticketId
- /tickets
- /trips
- /family
- /queue
- /admin-demo
- /accessibility
- /help
- /data-sources
- /not-found

ส่วน Login, Register, Forgot Password, Profile Cloud และ Settings ที่ต้องใช้ Supabase ให้ย้ายไป Phase 2 และไม่ต้องแสดงใน Navigation หลักของ Phase 1

ใน Phase 1 ให้ใช้ Guest Profile / Local Demo Profile แทน โดยผู้ใช้ยังสามารถใช้งาน Flow หลักได้ครบโดยไม่ต้องสมัครสมาชิก

**สิ่งที่ต้องเสร็จจริงใน Phase 1**

Flow นี้ต้องทดลองได้ครบโดยไม่ต้องตั้งค่า API Key หรือ Supabase:

ค้นหาสถานีหรือสถานที่ → เลือกต้นทางและปลายทาง → ดูแผนที่ MRT หลายสาย → คำนวณ Route → ดูค่าโดยสารจาก Fare Engine → เลือกชำระเงิน Demo → สร้าง Transaction → สร้าง Dynamic QR Ticket → Scan In Demo → Scan Out Demo → ดู Ticket ใน My Tickets

และต้องมี:

- MRT ทั้ง 4 สายครบใน Interactive Map
- OpenStreetMap Attribution
- Nominatim Search พร้อม Local Fallback
- Fare Engine ที่ไม่สุ่มราคา
- Smart Exit Guide ที่ไม่เดาทางออก
- Dynamic QR เปลี่ยน Token ทุก 20 วินาที
- Group Ticket ที่สร้าง QR แยกแต่ละคน
- Queue Monitor และ Admin Demo ที่อัปเดตข้อมูลทันที
- ไทย/อังกฤษครบทุกข้อความใน Phase 1
- Accessibility ทำงานจริงทั้งแอป
- Error, Loading, Empty, Retry และ Offline Fallback
- README ภาษาไทย
- Build, Typecheck และ Lint ผ่านก่อนสรุปงาน

เริ่ม Phase 1 ตามเงื่อนไขนี้ได้เลย โดยให้ทำให้ระบบหลักใช้งานได้ครบก่อน แล้วจึงค่อยต่อยอด Supabase และ Payment Gateway จริงใน Phase 2