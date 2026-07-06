# DMS ERP — Sandbox

Operations ERP for **Document Management Solutions (DMS)** — secure shredding, media destruction, scanning/digitization, and recycling operations. Tijuana, B.C.

This is the **sandbox** build: a fully client-side, zero-backend web app. All data lives in the browser (`localStorage`, `dmssbx-*` keys) with seeded demo records. Nothing entered here touches any live system.

## Run it

Open `index.html` in any modern browser — no server, build step, or install required. (GitHub Pages serves it directly.)

## Modules

| Area | Pages |
|---|---|
| Intake | New Vendor · New Customer · New Supplier (mobile-first ribbon forms) |
| Operations | Create Job → Dispatch · Directory · Scale Terminal · Inventory |
| Maintenance | Critical Maintenance · Preventive Maintenance · Equipment/Part Detail · Spare Parts |
| Recycling | Material Master · Mechanical Sampling · Commodity Pricing |
| Commercial | Pricing Formula · Price Editor · Purchasing · Review & Approve |
| Admin | HR · Employee Input · Administration · Claude Workbench |

`dms_materials.js` / `dms_prices.js` hold the material taxonomy (441 grades) and the commodity price book. `sbx_annotate.js` is the built-in markup/notes layer used to queue change requests.

## Notes

- Reset seeded data anytime by clearing the site's browser storage.
- Sandbox banner is intentional — this build is for experimentation and review.
