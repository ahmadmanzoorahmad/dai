import { createRequire } from "module";
import { URL } from "url";
import dns from "node:dns/promises";

const require = createRequire(import.meta.url);

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "metadata.google.internal",
  "169.254.169.254",
]);

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
  /^::ffff:127\./,
  /^::ffff:10\./,
  /^::ffff:192\.168\./,
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./,
];

function isPrivateIp(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return PRIVATE_IP_PATTERNS.some(re => re.test(normalized));
}

function parsedUrlSync(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\[|\]/g, "");

  if (BLOCKED_HOSTS.has(hostname)) {
    throw new Error("URL hostname is not allowed");
  }

  if (isPrivateIp(hostname)) {
    throw new Error("URL points to a private or reserved network address");
  }

  return parsed;
}

async function validateAndResolveUrl(rawUrl: string): Promise<URL> {
  const parsed = parsedUrlSync(rawUrl);
  const hostname = parsed.hostname.toLowerCase().replace(/\[|\]/g, "");

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error(`Cannot resolve hostname: ${hostname}`);
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error(
        `URL resolves to a private or reserved network address (${address})`
      );
    }
  }

  return parsed;
}

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

async function safeFetch(startUrl: string): Promise<import("node-fetch").Response> {
  const fetch = (await import("node-fetch")).default;

  let currentUrl = startUrl;
  let redirectsLeft = MAX_REDIRECTS;

  while (true) {
    const validated = await validateAndResolveUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: import("node-fetch").Response;
    try {
      response = await fetch(validated.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InsightAI-Bot/1.0)" },
        signal: controller.signal,
        size: MAX_RESPONSE_SIZE,
        redirect: "manual",
      } as Parameters<typeof fetch>[1]);
    } finally {
      clearTimeout(timer);
    }

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) {
      return response;
    }

    if (redirectsLeft-- <= 0) {
      throw new Error("Too many redirects");
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error("Redirect response missing Location header");
    }

    currentUrl = new URL(location, currentUrl).toString();
  }
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const cheerio = await import("cheerio");
  const response = await safeFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/csv")) {
    const text = await response.text();
    return `CSV Data:\n${text}`;
  }

  if (contentType.includes("application/json")) {
    const text = await response.text();
    return `JSON Data:\n${text}`;
  }

  const html = await response.text();

  if (!contentType.includes("text/html") && /^[^<,\n]+,[^<\n]+/.test(html.slice(0, 200))) {
    return `CSV Data:\n${html}`;
  }

  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, noscript, iframe, [role='banner'], [role='navigation']").remove();

  const mainContent = $("main, article, [role='main'], .content, #content, .main").first();
  const source = mainContent.length ? mainContent : $("body");

  const lines: string[] = [];
  source.find("h1, h2, h3, h4, p, li, td, th, pre, blockquote").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) lines.push(text);
  });

  const result = lines.join("\n").slice(0, 50000);
  return result || $("body").text().replace(/\s+/g, " ").trim().slice(0, 50000);
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (mimetype === "text/csv" || ext === "csv") {
    return `CSV Data:\n${buffer.toString("utf-8")}`;
  }

  if (mimetype === "text/plain" || ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  if (mimetype === "application/json" || ext === "json") {
    return `JSON Data:\n${buffer.toString("utf-8")}`;
  }

  if (mimetype === "application/pdf" || ext === "pdf") {
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return `PDF Document:\n${data.text}`;
    } catch {
      throw new Error("Failed to parse PDF file");
    }
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    try {
      const XLSX = require("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheets.push(`Sheet: ${sheetName}\n${csv}`);
      }
      return `Excel Spreadsheet:\n${sheets.join("\n\n")}`;
    } catch {
      throw new Error("Failed to parse Excel file");
    }
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return `Word Document:\n${result.value}`;
    } catch {
      throw new Error("Failed to parse Word (.docx) file");
    }
  }

  if (mimetype === "application/msword" || ext === "doc") {
    throw new Error(
      "Legacy .doc format is not supported. Please save as .docx and re-upload.",
    );
  }

  return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
}
