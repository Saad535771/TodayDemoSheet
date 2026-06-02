import React from "react";
import html2canvas from "html2canvas";
import invoiceTemplate from "../assets/invoice/FORM-PNG.png";

const INVOICE_WIDTH = 882;
const INVOICE_HEIGHT = 1024;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function valueOf(row, keys, fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return fallback;
}

function parseAmount(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function formatAmount(value) {
  const num = parseAmount(value);
  if (num === null) return escapeHtml(value || "0");
  return num.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function getTotalAmount(row) {
  const total = parseAmount(row?.totalFees ?? row?.totalFee ?? row?.fee);
  if (total !== null) return total;

  const tutorFee = parseAmount(row?.tutorFee ?? row?.tutorShare);
  const lacasShare = parseAmount(row?.lacasShare);
  if (tutorFee !== null || lacasShare !== null) return (tutorFee ?? 0) + (lacasShare ?? 0);

  return 0;
}

function formatDate(value) {
  const raw = String(value || "").trim();
  if (raw && raw !== "0000-00-00") {
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;

    const slash = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/);
    if (slash) {
      const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
      return `${String(slash[1]).padStart(2, "0")}-${String(slash[2]).padStart(2, "0")}-${year}`;
    }

    return raw;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\//g, "-");
}

function addOneDayToDate(dateText) {
  const match = String(dateText || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return dateText;

  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  date.setDate(date.getDate() + 1);
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function getInvoiceNumber(row, rowIndex) {
  const existing = valueOf(row, ["invoiceNo", "invoiceNumber", "invoice", "billNo"]);
  if (existing) return existing;

  const id = valueOf(row, ["id", "paymentId", "rowId"], rowIndex || "1");
  const lastTwo = String(id).replace(/\D/g, "").slice(-2).padStart(2, "0");
  return `00-00-${lastTwo || "01"}`;
}

function getContactNumber(row) {
  return valueOf(row, [
    "contactNumber",
    "contactNo",
    "contact",
    "contact_number",
    "phone",
    "mobile",
    "parentPhone",
    "parentContact",
    "whatsapp",
    "whatsappNumber",
  ]);
}

function normalizeWhatsappNumber(number) {
  const raw = String(number || "").trim();
  if (!raw) return "";

  // Contact column me agar space/dash/slash ya multiple numbers hon,
  // to WhatsApp ke liye first valid Pakistani number pick karega.
  const firstPhoneMatch = raw.match(/(?:\+|00)?92[\s-]*3[\d\s-]{9,13}|0?3[\d\s-]{9,13}/);
  const selectedNumber = firstPhoneMatch ? firstPhoneMatch[0] : raw;

  let digits = selectedNumber.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (digits.startsWith("3") && digits.length === 10) digits = `92${digits}`;

  return digits;
}

function teacherHtml(value) {
  const text = String(value || "").trim();
  if (!text) return "-";

  return escapeHtml(text)
    .replace(/\s*&amp;\s*/g, "<br />&amp; ")
    .replace(/,\s*/g, ",<br />");
}

function buildInvoiceHtml(row, rowIndex, { autoPrint = true } = {}) {
  const tuitionName = valueOf(
    row,
    ["tuitionName", "description", "studentName"],
    "LACAS Home Tutors"
  );
  const teacherName = valueOf(row, ["tutorName", "teacherName", "teacher"], "-");

  // PaymentSheetWithDate wali manual Payment Date ko invoice date banaya gaya hai.
  // Backend DB column payment_date ho to API/model isko paymentDate ya payment_date me send kare.
  const invoiceDate = formatDate(
    valueOf(row, ["paymentDate", "payment_date", "invoiceDate", "invoice_date", "date"])
  );

  const explicitDueDate = valueOf(row, ["dueDate", "invoiceDueDate"]);
  const dueDate = explicitDueDate ? formatDate(explicitDueDate) : addOneDayToDate(invoiceDate);
  const invoiceNo = getInvoiceNumber(row, rowIndex);
  const totalAmount = getTotalAmount(row);
  const totalFormatted = formatAmount(totalAmount);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LACAS Invoice - ${escapeHtml(tuitionName)}</title>
  <style>
    @page { size: ${INVOICE_WIDTH}px ${INVOICE_HEIGHT}px; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-page {
      position: relative;
      width: ${INVOICE_WIDTH}px;
      height: ${INVOICE_HEIGHT}px;
      min-height: ${INVOICE_HEIGHT}px;
      margin: 0 auto;
      overflow: hidden;
      background: #ffffff;
    }
    .invoice-template-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      z-index: 0;
      pointer-events: none;
      user-select: none;
    }
    .dynamic-layer {
      position: absolute;
      inset: 0;
      z-index: 2;
    }

    .client-name {
      position: absolute;
      left: 42px;
      top: 248px;
      width: 475px;
      color: #000000;
      font-size: 18px;
      line-height: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.4px;
      border-bottom: 2px solid rgba(9, 9, 9, 0.88);
      padding: 0 8px 7px 0;
    }
    .invoice-meta {
      position: absolute;
      left: 32px;
      top: 304px;
      width: 330px;
      padding: 11px 14px 12px;
      background: rgb(255, 255, 255);
      color: #030303;
      font-size: 15px;
      font-weight: 900;
      line-height: 1.6;
      letter-spacing: .4px;
    }
    .invoice-meta .row {
      display: grid;
      grid-template-columns: 105px 16px 1fr;
      align-items: center;
    }
    .invoice-meta .label { color: #010101; }
    .invoice-meta .colon,
    .invoice-meta .value { color: #000000; }

    .table-wrap {
      position: absolute;
      left: 44px;
      top: 426px;
      width: 704px;
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 15px;
      font-weight: 900;
      border: 2px solid #ffffff;
    }
    .invoice-table th {
      background: #ef4023;
      color: #ffffff;
      font-size: 18px;
      padding: 12px 8px;
      border-right: 2px solid #ffffff;
      text-align: center;
      height: 44px;
    }
    .invoice-table th:last-child { border-right: 0; }
    .invoice-table td {
      border: 2px solid #ef4023;
      padding: 10px 10px;
      height: 94px;
      text-align: center;
      vertical-align: middle;
      background: rgb(255, 255, 255);
      color: #111111;
    }
    .invoice-table .col-no { width: 70px; }
    .invoice-table .col-desc { width: 248px; }
    .invoice-table td.col-desc { text-align: left; padding-left: 18px; }
    .invoice-table .col-teacher { width: 156px; font-size: 13px; line-height: 1.18; }
    .invoice-table .col-fee,
    .invoice-table .col-total { width: 115px; font-size: 20px; }

    .totals {
      position: absolute;
      right: 64px;
      top: 628px;
      width: 320px;
      padding: 14px 12px;
      color: #1b1b1b;
      font-size: 19px;
      line-height: 1.9;
      font-weight: 900;
    }
    .totals .line {
      display: grid;
      grid-template-columns: 145px 18px 1fr;
      column-gap: 8px;
      align-items: center;
    }
    .totals .amount,
    .totals .colon { color: #000000; }

    .footer-note {
      position: absolute;
      left: 44px;
      bottom: 148px;
      color: #020202;
      font-size: 16px;
      font-weight: 800;
    }
    .contact-grid {
      position: absolute;
      left: 44px;
      right: 44px;
      bottom: 76px;
      display: grid;
      grid-template-columns: 285px 1fr;
      column-gap: 40px;
      row-gap: 11px;
      color: #121212;
      font-size: 15px;
      font-weight: 800;
     
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 13px;
      min-width: 0;
    }
    .icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #ef4023;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 900;
      flex: 0 0 auto;
    }
    @media screen and (max-width: 850px) {
      body { background: #ffffff; }
      .invoice-page { transform-origin: top left; }
    }
    @media print {
      html, body {
        width: ${INVOICE_WIDTH}px;
        height: ${INVOICE_HEIGHT}px;
        background: #ffffff;
        overflow: hidden;
      }
      .invoice-page {
        width: ${INVOICE_WIDTH}px;
        height: ${INVOICE_HEIGHT}px;
        min-height: ${INVOICE_HEIGHT}px;
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <img class="invoice-template-bg" src="${invoiceTemplate}" alt="LACAS invoice template" />

    <div class="dynamic-layer">
      <div class="client-name">${escapeHtml(tuitionName)}</div>

      <div class="invoice-meta">
        <div class="row"><span class="label">INVOICE</span><span class="colon">:</span><span class="value">${escapeHtml(invoiceNo)}</span></div>
        <div class="row"><span class="label">DATE</span><span class="colon">:</span><span class="value">${escapeHtml(invoiceDate)}</span></div>
        <div class="row"><span class="label">DUE DATE</span><span class="colon">:</span><span class="value">${escapeHtml(dueDate)}</span></div>
      </div>

      <div class="table-wrap">
        <table class="invoice-table">
          <thead>
            <tr>
              <th class="col-no">No#</th>
              <th class="col-desc">Description</th>
              <th class="col-teacher">Teacher</th>
              <th class="col-fee">Fee</th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-no">1</td>
              <td class="col-desc">${escapeHtml(tuitionName)}</td>
              <td class="col-teacher">${teacherHtml(teacherName)}</td>
              <td class="col-fee">${totalFormatted}</td>
              <td class="col-total">${totalFormatted}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="line"><span>Subtotal</span><span class="colon">:</span><span class="amount">${totalFormatted}</span></div>
        <div class="line"><span>Due Amount</span><span class="colon">:</span><span class="amount">${totalFormatted}</span></div>
      </div>
  </div>
  ${autoPrint ? `<script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 700); });</script>` : ""}
</body>
</html>`;
}
function openInvoiceWindow(row, rowIndex, options = {}) {
  const invoiceWindow = window.open("", "_blank", "width=850,height=1080");
  if (!invoiceWindow) {
    alert("Popup blocked. Please allow popups for this site to open invoice.");
    return false;
  }
  invoiceWindow.document.open();
  invoiceWindow.document.write(buildInvoiceHtml(row, rowIndex, options));
  invoiceWindow.document.close();
  return true;
}
function printInvoice(row, rowIndex) {
  openInvoiceWindow(row, rowIndex, { autoPrint: true });
}
function waitForInvoiceAssets(doc) {
  const images = Array.from(doc.images || []);
  if (!images.length) return Promise.resolve();
  return Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}
async function buildInvoiceImageFile(row, rowIndex) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = `${INVOICE_WIDTH}px`;
  iframe.style.height = `${INVOICE_HEIGHT}px`;
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error("Invoice image document could not be created.");
    doc.open();
    doc.write(buildInvoiceHtml(row, rowIndex, { autoPrint: false }));
    doc.close();
    await new Promise((resolve) => {
      iframe.onload = resolve;
      window.setTimeout(resolve, 800);
    });
    await waitForInvoiceAssets(doc);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const invoicePage = doc.querySelector(".invoice-page");
    if (!invoicePage) throw new Error("Invoice template not found.");
    const canvas = await html2canvas(invoicePage, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: INVOICE_WIDTH,
      height: INVOICE_HEIGHT,
      windowWidth: INVOICE_WIDTH,
      windowHeight: INVOICE_HEIGHT,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) throw new Error("Invoice image could not be generated.");
    const safeInvoiceNo = getInvoiceNumber(row, rowIndex).replace(/[^a-z0-9-]/gi, "-");
    return new File([blob], `LACAS-Invoice-${safeInvoiceNo}.png`, { type: "image/png" });
  } finally {
    iframe.remove();
  }
}
function downloadInvoiceImage(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || "LACAS-Invoice.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function openWhatsapp(row, rowIndex) {
  const contactNumber = getContactNumber(row);
  const phone = normalizeWhatsappNumber(contactNumber);

  if (!phone) {
    alert("Contact number missing. Please add contact number in the Contact column first.");
    return;
  }

  try {
    const invoiceFile = await buildInvoiceImageFile(row, rowIndex);

    // Supported mobile browsers/direct share sheet: image file send ho sakti hai.
    if (navigator.canShare?.({ files: [invoiceFile] }) && navigator.share) {
      await navigator.share({
        files: [invoiceFile],
        title: "LACAS Invoice",
      });
      return;
    }

    // Desktop: pehle invoice image download hogi, phir exact Contact column wala number
    // WhatsApp Web/Desktop me phone parameter ke sath open hoga.
    downloadInvoiceImage(invoiceFile);

    const whatsappUrl = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}`;
    const fallbackUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&type=phone_number&app_absent=0`;

    const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = fallbackUrl;
    }

    alert("Invoice image has been downloaded. WhatsApp is opening with the selected contact number; please attach/paste the downloaded invoice image.");
  } catch (err) {
    console.error("WHATSAPP INVOICE IMAGE ERROR:", err);
    openInvoiceWindow(row, rowIndex, { autoPrint: false });

    const fallbackUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&type=phone_number&app_absent=0`;
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  }
}

export default function PaymentSheetInvoiceActions({
  row,
  rowIndex,
  canPrintInvoice = true,
  canWhatsappInvoice = true,
}) {
  if (!canPrintInvoice && !canWhatsappInvoice) return null;

  return (
    <>
      {canPrintInvoice && (
        <button
          type="button"
          className="pswd-invoice-btn pswd-invoice-print-btn"
          onClick={() => printInvoice(row, rowIndex)}
          title="Print invoice"
        >
          Print Invoice
        </button>
      )}

      {canWhatsappInvoice && (
        <button
          type="button"
          className="pswd-invoice-btn pswd-invoice-whatsapp-btn"
          onClick={() => openWhatsapp(row, rowIndex)}
          title="Open WhatsApp for this contact"
          aria-label="Open WhatsApp"
        >
          <svg viewBox="0 0 32 32" width="15" height="15" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16.02 3.2A12.72 12.72 0 0 0 5.23 22.65L3.8 28.8l6.3-1.45A12.71 12.71 0 1 0 16.02 3.2Zm0 22.93c-2.08 0-4.02-.62-5.64-1.69l-.4-.26-3.74.86.84-3.65-.27-.42a10.17 10.17 0 1 1 9.21 5.16Zm5.7-7.62c-.31-.15-1.84-.91-2.13-1.01-.28-.1-.49-.15-.7.15-.2.31-.8 1.01-.98 1.22-.18.2-.36.23-.67.08-.31-.16-1.31-.48-2.5-1.53-.92-.82-1.55-1.84-1.73-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.36.46-.54.15-.18.2-.31.31-.52.1-.21.05-.39-.03-.54-.08-.15-.7-1.68-.95-2.3-.25-.6-.5-.52-.7-.53h-.59c-.2 0-.54.08-.82.39-.28.31-1.08 1.05-1.08 2.56 0 1.51 1.1 2.97 1.25 3.17.15.2 2.17 3.31 5.26 4.64.74.32 1.31.51 1.76.65.74.23 1.42.2 1.95.12.6-.09 1.84-.75 2.1-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.59-.36Z"
            />
          </svg>
        </button>
      )}
    </>
  );
}
