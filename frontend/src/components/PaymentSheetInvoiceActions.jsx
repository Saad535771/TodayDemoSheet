import React from "react";
import lacasLogo from "../assets/invoice/lacas-invoice-logo.png";
import stampImage from "../assets/invoice/Stemp.png";
import signatureImage from "../assets/invoice/Sajjad-Signature.png";

const LACAS_PHONE = "03174859190";
const LACAS_EMAIL = "info@lacashometutors.com";
const LACAS_WEBSITE = "www.lacashometutors.com";
const LACAS_ADDRESS = "H Block 51, Johar Town, Lahore";

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
  let raw = String(number || "").trim();
  if (!raw) return "";

  raw = raw.replace(/[^\d+]/g, "");
  if (raw.startsWith("+")) return raw.replace("+", "");
  if (raw.startsWith("00")) return raw.slice(2);
  if (raw.startsWith("0")) return `92${raw.slice(1)}`;
  return raw;
}

function teacherHtml(value) {
  const text = String(value || "").trim();
  if (!text) return "-";

  return escapeHtml(text)
    .replace(/\s*&amp;\s*/g, "<br />&amp; ")
    .replace(/,\s*/g, ",<br />");
}

function buildWhatsappMessage(row) {
  const tuitionName = valueOf(row, ["tuitionName", "description", "studentName"], "your tuition");
  const totalFormatted = formatAmount(getTotalAmount(row));

  return [
    "Assalam o Alaikum,",
    "Please find your LACAS Home Tutors invoice.",
    `Tuition: ${tuitionName}`,
    `Due Amount: PKR ${totalFormatted}`,
    "Thank you.",
  ].join("\n");
}

function buildInvoiceHtml(row, rowIndex, { autoPrint = true } = {}) {
  const tuitionName = valueOf(row, ["tuitionName", "description", "studentName"], "LACAS Home Tutors");
  const teacherName = valueOf(row, ["tutorName", "teacherName", "teacher"], "-");
  const invoiceDate = formatDate(valueOf(row, ["invoiceDate", "paymentDate", "date"]));
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
    @page { size: 768px 1024px; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: #e5e7eb;
      font-family: Arial, Helvetica, sans-serif;
      color: #111111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-page {
      position: relative;
      width: 768px;
      min-height: 1024px;
      margin: 0 auto;
      background: #ffffff;
      overflow: hidden;
      padding: 0 32px;
    }
    .top-orange,
    .bottom-orange {
      position: absolute;
      left: 0;
      width: 100%;
      height: 37px;
      background: #ef4023;
      z-index: 1;
    }
    .top-orange { top: 0; }
    .bottom-orange { bottom: 0; }
    .top-slashes,
    .bottom-slashes {
      position: absolute;
      right: 0;
      width: 270px;
      height: 92px;
      z-index: 2;
      pointer-events: none;
    }
    .top-slashes { top: 0; }
    .bottom-slashes { bottom: 0; transform: rotate(180deg); }
    .slash {
      position: absolute;
      width: 82px;
      height: 126px;
      top: -36px;
      transform: skewX(-42deg);
      background: #170b52;
    }
    .slash.s1 { right: 116px; }
    .slash.s2 { right: 20px; }
    .slash-accent {
      position: absolute;
      width: 13px;
      height: 116px;
      top: -20px;
      transform: skewX(-42deg);
      background: #24407e;
    }
    .slash-accent.a1 { right: 107px; }
    .slash-accent.a2 { right: 12px; }
    .header-area {
      position: relative;
      height: 214px;
      z-index: 3;
    }
    .logo {
      position: absolute;
      left: 2px;
      top: 98px;
      width: 256px;
      height: auto;
      object-fit: contain;
    }
    .title {
      position: absolute;
      right: 45px;
      top: 128px;
      color: #ef4023;
      font-size: 50px;
      line-height: 1;
      letter-spacing: 8px;
      font-weight: 900;
    }
    .client-name {
      font-size: 17px;
      line-height: 20px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .15px;
      display: inline-block;
      min-width: 280px;
      border-bottom: 1.7px solid #111111;
      padding: 0 8px 6px 0;
      margin-bottom: 55px;
      position: relative;
      z-index: 3;
    }
    .invoice-meta {
      width: 315px;
      font-size: 17px;
      font-weight: 900;
      line-height: 1.45;
      margin-bottom: 50px;
      position: relative;
      z-index: 3;
    }
    .invoice-meta .label { display: inline-block; width: 88px; }
    .invoice-meta .colon { display: inline-block; width: 20px; }
    .table-wrap {
      position: relative;
      z-index: 3;
      width: 681px;
      margin-top: 0;
    }
    .stamp-watermark {
      position: absolute;
      width: 372px;
      left: 105px;
      top: 36px;
      opacity: 0.045;
      z-index: 0;
      pointer-events: none;
    }
    table.invoice-table {
      position: relative;
      z-index: 2;
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 16px;
      font-weight: 900;
    }
    .invoice-table th {
      background: #ef4023;
      color: #ffffff;
      font-size: 19px;
      padding: 12px 10px;
      border-right: 3px solid #ffffff;
      text-align: center;
      height: 41px;
    }
    .invoice-table th:last-child { border-right: 0; }
    .invoice-table td {
      border: 2px solid #ef4023;
      padding: 10px 12px;
      height: 132px;
      text-align: center;
      vertical-align: middle;
      background: rgba(255,255,255,.88);
    }
    .invoice-table .col-no { width: 74px; }
    .invoice-table .col-desc { width: 260px; text-align: left; }
    .invoice-table .col-teacher { width: 138px; font-size: 12px; line-height: 1.13; }
    .invoice-table .col-fee,
    .invoice-table .col-total { width: 104px; font-size: 21px; }
    .totals {
      width: 340px;
      margin: 54px 22px 0 auto;
      font-size: 21px;
      line-height: 1.85;
      font-weight: 900;
      position: relative;
      z-index: 3;
    }
    .totals .line {
      display: grid;
      grid-template-columns: 155px 20px 1fr;
      column-gap: 10px;
      align-items: center;
    }
    .signature-block {
      position: relative;
      margin-top: 34px;
      width: 240px;
      z-index: 3;
    }
    .signature-stamp {
      position: absolute;
      width: 250px;
      left: -2px;
      top: -40px;
      opacity: .18;
      z-index: 0;
    }
    .signature-img {
      position: relative;
      width: 182px;
      height: 79px;
      object-fit: contain;
      z-index: 2;
      display: block;
    }
    .sign-line {
      width: 195px;
      border-bottom: 2px solid #ef4023;
      margin-top: -10px;
    }
    .accounts {
      font-size: 22px;
      line-height: 1.1;
      font-weight: 900;
      margin-top: 8px;
    }
    .footer-note {
      margin-top: 34px;
      font-size: 18px;
      font-weight: 900;
      z-index: 3;
      position: relative;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: 250px 310px;
      column-gap: 45px;
      row-gap: 12px;
      margin-top: 22px;
      font-size: 16px;
      font-weight: 900;
      position: relative;
      z-index: 3;
    }
    .contact-item { display: flex; align-items: center; gap: 14px; min-width: 0; }
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
    @media screen and (max-width: 800px) {
      body { background: #ffffff; }
      .invoice-page { transform-origin: top left; }
    }
    @media print {
      html, body { width: 768px; height: 1024px; background: #ffffff; overflow: hidden; }
      .invoice-page { width: 768px; height: 1024px; min-height: 1024px; margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    <div class="top-orange"></div>
    <div class="top-slashes"><span class="slash s1"></span><span class="slash s2"></span><span class="slash-accent a1"></span><span class="slash-accent a2"></span></div>
    <div class="bottom-orange"></div>
    <div class="bottom-slashes"><span class="slash s1"></span><span class="slash s2"></span><span class="slash-accent a1"></span><span class="slash-accent a2"></span></div>

    <div class="header-area">
      <img class="logo" src="${lacasLogo}" alt="LACAS Home Tutors" />
      <div class="title">INVOICE</div>
    </div>

    <div class="client-name">${escapeHtml(tuitionName)}</div>

    <div class="invoice-meta">
      <div><span class="label">INVOICE</span><span class="colon">:</span><span>${escapeHtml(invoiceNo)}</span></div>
      <div><span class="label">DATE</span><span class="colon">:</span><span>${escapeHtml(invoiceDate)}</span></div>
      <div><span class="label">DUE DATE</span><span class="colon">:</span><span>${escapeHtml(dueDate)}</span></div>
    </div>

    <div class="table-wrap">
      <img class="stamp-watermark" src="${stampImage}" alt="LACAS stamp watermark" />
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
      <div class="line"><span>Subtotal</span><span>:</span><span>${totalFormatted}</span></div>
      <div class="line"><span>Due Amount</span><span>:</span><span>${totalFormatted}</span></div>
    </div>

    <div class="signature-block">
      <img class="signature-stamp" src="${stampImage}" alt="LACAS stamp" />
      <img class="signature-img" src="${signatureImage}" alt="Accounts Signature" />
      <div class="sign-line"></div>
      <div class="accounts">Accounts</div>
    </div>

    <div class="footer-note">If you have any questions about this invoice, please contact us.</div>
    <div class="contact-grid">
      <div class="contact-item"><span class="icon">☎</span><span>${LACAS_PHONE}</span></div>
      <div class="contact-item"><span class="icon">✉</span><span>${LACAS_EMAIL}</span></div>
      <div class="contact-item"><span class="icon">🌐</span><span>${LACAS_WEBSITE}</span></div>
      <div class="contact-item"><span class="icon">●</span><span>${LACAS_ADDRESS}</span></div>
    </div>
  </div>
  ${autoPrint ? `<script>window.addEventListener('load', function () { setTimeout(function () { window.focus(); window.print(); }, 500); });</script>` : ""}
</body>
</html>`;
}

function openInvoiceWindow(row, rowIndex, options = {}) {
  const invoiceWindow = window.open("", "_blank", "width=820,height=1080");
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

function openWhatsapp(row, rowIndex) {
  const contactNumber = getContactNumber(row);
  const phone = normalizeWhatsappNumber(contactNumber);

  if (!phone) {
    alert("Contact number missing. Please add contact number in the Contact column first.");
    return;
  }

  // Same invoice layout opens as preview, then WhatsApp opens for the selected contact.
  // Browser/desktop WhatsApp does not allow auto-attaching an image through URL scheme,
  // so the invoice preview uses the exact same design for manual sending/screenshot/PDF.
  openInvoiceWindow(row, rowIndex, { autoPrint: false });

  const encodedMessage = encodeURIComponent(buildWhatsappMessage(row));
  const appUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
  const webUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  window.setTimeout(() => {
    window.location.href = appUrl;
  }, 250);

  window.setTimeout(() => {
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }, 1100);
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
