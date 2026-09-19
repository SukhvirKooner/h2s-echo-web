# H2S-ECHO

Industrial safety platform for hydrogen sulfide exposure evidence.

H2S-ECHO pairs a wearable wristband cartridge with a field phone app and this web console. The cartridge passively records H₂S on three chemical channels — **S1 FAST**, **S2 MEDIUM**, and **S3 SLOW**. After each shift, the phone scans the cartridge QR, photographs the face, and decodes dose and exposure pattern. **The phone captures the chemical record; the website preserves, organizes, analyses, and monitors the exposure evidence.**

Cartridges are reusable across a controlled lifecycle:

**EXPOSURE → RECOVERY → BASELINE RECOVERED → READY → REUSE** (or **EXPIRED**)

## Capabilities

- **Dashboard** — live site KPIs, dose trends, pattern distribution, phone sync feed, and alerts  
- **Workers & shifts** — personnel profiles, active shift timers, cartridge assignment  
- **Cartridges** — batch / chemistry / calibration versions, QR identity, accuracy verification, removal from use  
- **Exposure records** — searchable dose history with validity, confidence, and pattern  
- **Result verification** — gate-by-gate validation (image quality, optical REF W/G/D, S1–S3 fingerprint, timing, recovery)  
- **Analytics** — worker-, shift-, and area-wise trends with heatmap and date filters  
- **Lifecycle board** — kanban of cartridges by stage with recovery and cycle tracking  
- **Reports** — worker, shift, exposure, and cartridge reports with PDF / CSV export  
- **Monitoring** — high-exposure alerts, invalid readings, acknowledge / resolve actions  
- **Audit & traceability** — interactive chain WORKER → SHIFT → CARTRIDGE → EXPOSURE → PHONE READOUT → RESULT  
- **System management** — calibration versions, batches, users, roles, and site configuration (Admin)

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full platform, including System Management |
| **Safety Officer** | Operations, monitoring, records, and reports |

## Stack

React · TypeScript · Tailwind CSS · Framer Motion · Recharts · Zustand

## Getting started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

### Sign-in

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@h2secho.demo` | `admin123` |
| Safety Officer | `safety@h2secho.demo` | `safety123` |

## Product story

LOGIN → Dashboard → Worker → Shift → Cartridge → Exposure → Phone readout → Validation → Dose & pattern → History → Analytics → Report → Monitor
