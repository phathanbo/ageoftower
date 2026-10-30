# 🏰 Chronicles of Towers: Era Evolution

> เว็บเกมแนว Tower Defense & City-Building วางผังเมืองพัฒนาป้อมก้าวข้ามกาลเวลา (ตั้งแต่ยุคหินโบราณ จนถึงยุคเทคโนโลยีอวกาศขั้นสูงสุด) ด้วยระบบสร้างแผนที่แบบสุ่มเฉพาะตัว (Procedural Seeded Map) ไม่ซ้ำซาก เล่นบนเบราว์เซอร์ได้ทันที ไม่กินสเปกเครื่อง!

---

## 🌟 ฟีเจอร์เด่นของเกม (Features)

1. **วิวัฒนาการ 5 ยุคสมัย (5 Civilization Eras):**
   - 🪨 **ยุคหิน (Stone Age):** หอขว้างหิน, ป้อมหอกไม้, เสาโทเทมเพลิง, กระต๊อบคนป่า
   - ⚔️ **ยุคกลาง (Medieval Kingdom):** หอพลธนู, หน้าไม้กลยักษ์, เครื่องดีดหินเพลิง, กังหันลมหลวง
   - ⚙️ **ยุคอุตสาหกรรม (Industrial Steampunk):** ปืนกลไอน้ำแกตลิ่ง, ปืนใหญ่ Howitzer, หอคอยสายฟ้าเทสลา, โรงงานจักรไอน้ำ
   - 🚀 **ยุคปัจจุบัน (Modern Warfare):** ฐานยิงขีปนาวุธ SAM, ป้อมเลเซอร์เข้มข้น, ป้อมไนโตรเจนเหลว (Slow), สถาบันวิจัย
   - 🌌 **ยุคเทคโนโลยีอวกาศ (Galactic Space Age):** ปืนใหญ่ปฏิสสาร (Antimatter), ลำแสงดาวเทียมวงโคจร (Orbital Strike), หอคอยบิดเบือนเวลา (Chronos Warp), ไดสันโหนด (Dyson Node)

2. **ระบบแผนที่แบบสุ่มไม่ซ้ำซาก (Procedural Map Generation):**
   - แต่ละแมพมี Seed สุ่มเฉพาะบุคคล ไม่ว่าจะเป็นเส้นทางเดินศัตรู ทางน้ำ ภูเขา และตำแหน่งสิ่งกีดขวาง
   - สามารถกดปุ่ม **"🎲 สุ่มแมพใหม่"** เพื่อสลับไปเล่นในภูมิประเทศใหม่ได้ไม่จำกัด

3. **กราฟิก Isometric 2.5D เวกเตอร์แคนวาส เบา ลื่นไหล สวยงาม:**
   - 100% Canvas API & Vector Shader Lighting (ไม่กินเน็ต ไม่เปลืองแรม)
   - แสงสีธีมและบรรยากาศเปลี่ยนไปตามแต่ละยุคสมัยแบบอัตโนมัติ

4. **Web Audio Synthesizer:**
   - ระบบสังเคราะห์เสียงในตัว (Sound Synth) โดยตรงผ่าน Web Audio API โหลดไว ไม่มีโหลดไฟล์เสียง MP3 กวนใจ

---

## 🚀 วิธีรันโปรเจกต์ในเครื่อง (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รัน Local Development Server
npm run dev

# 3. เปิดเบราว์เซอร์ที่ http://localhost:5173
```

---

## 🌐 วิธีนำขึ้น GitHub Pages เล่นออนไลน์ฟรี

1. สร้าง Repository ใหม่บน GitHub ของคุณ (เช่น `age-of-towers`)
2. นำไฟล์ขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Chronicles of Towers"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```
3. บน GitHub ไปที่ **Settings** > **Pages**
4. ในช่อง **Build and deployment** ให้เลือก **Source: GitHub Actions**
5. รอ GitHub Action รันเสร็จประมาณ 1 นาที จากนั้นคุณจะได้รับ URL เว็บสำหรับเปิดเล่นได้ทันทีจากทุกอุปกรณ์!
