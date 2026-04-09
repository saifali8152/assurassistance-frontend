import * as XLSX from "xlsx";

/** Example email in downloaded templates — import skips this row so the sample is not treated as a traveller */
export const GROUP_TEMPLATE_EXAMPLE_EMAIL = "alina.dupont@test.ci";

/** Default English headers (import accepts EN/FR column titles) */
export const GROUP_EXCEL_HEADERS = [
  "Surname",
  "Given names",
  "Date of Birth",
  "Gender",
  "Nationality",
  "Country of residence",
  "Email",
  "Telephone N°",
  "Passport N° / ID N°",
  "Address"
];

export interface GroupMemberImport {
  last_name: string;
  first_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  country_of_residence: string;
  email: string;
  phone: string;
  passport_or_id: string;
  address: string;
}

function norm(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Map messy header → field (English + French template headers) */
function headerToField(header: string): keyof GroupMemberImport | null {
  const h = norm(header);
  if (h.includes("prenom") || (h.includes("given") && h.includes("name"))) return "first_name";
  if (
    h === "surname" ||
    h === "nom" ||
    h.includes("nom de famille") ||
    (h.includes("surname") && !h.includes("given"))
  )
    return "last_name";
  if (h.includes("date") && (h.includes("birth") || h.includes("naissance"))) return "date_of_birth";
  if (h === "gender" || h.includes("sex") || h === "sexe") return "gender";
  if (h.includes("nationality") || h.includes("nationalite")) return "nationality";
  if (
    (h.includes("country") && h.includes("residence")) ||
    (h.includes("pays") && h.includes("residence"))
  )
    return "country_of_residence";
  if (h.includes("email") || h.includes("courriel") || h === "e-mail" || h.startsWith("e mail"))
    return "email";
  if (
    h.includes("telephone") ||
    h.includes("phone") ||
    h === "tel" ||
    h.includes("mobile") ||
    h.includes("portable")
  )
    return "phone";
  if (
    h.includes("passport") ||
    h.includes("passeport") ||
    h.includes("id n") ||
    h.includes("id no") ||
    h.includes("cni") ||
    (h.includes("carte") && h.includes("identite"))
  )
    return "passport_or_id";
  if (h.includes("address") || h.includes("adresse")) return "address";
  return null;
}

function formatExcelDate(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    const d = v.getDate().toString().padStart(2, "0");
    const m = (v.getMonth() + 1).toString().padStart(2, "0");
    return `${v.getFullYear()}-${m}-${d}`;
  }
  if (typeof v === "number") {
    const epoch = new Date((v - 25569) * 86400 * 1000);
    if (!Number.isNaN(epoch.getTime())) {
      const d = epoch.getUTCDate().toString().padStart(2, "0");
      const m = (epoch.getUTCMonth() + 1).toString().padStart(2, "0");
      return `${epoch.getUTCFullYear()}-${m}-${d}`;
    }
  }
  const s = String(v).trim();
  const slash = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(s);
  if (slash) {
    const y = slash[1];
    const mo = slash[2].padStart(2, "0");
    const d = slash[3].padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return s;
}

export interface GroupTemplateDownloadOptions {
  /** Localized column titles (row 1) */
  headers: string[];
  /** Example values (row 2) — same length and order as headers */
  exampleRow: string[];
  /** Worksheet tab name */
  sheetName?: string;
  /** Downloaded file name */
  fileName?: string;
}

export function downloadGroupTemplateFile(options: GroupTemplateDownloadOptions) {
  const { headers, exampleRow, sheetName = "Travellers", fileName = "group-travellers-template.xlsx" } = options;
  if (exampleRow.length !== headers.length) {
    console.warn("groupCaseExcel: example row length does not match headers");
  }
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export async function parseGroupExcelFile(file: File): Promise<GroupMemberImport[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // raw: true so numeric Excel date cells stay as serials (or Date with cellDates), not locale strings like "04 December 1979"
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: true
  }) as unknown[][];

  if (!matrix.length) return [];

  const headerRow = matrix[0].map((c) => String(c ?? "").trim());
  const colMap: Partial<Record<keyof GroupMemberImport, number>> = {};
  headerRow.forEach((h, i) => {
    const f = headerToField(h);
    if (f && colMap[f] === undefined) colMap[f] = i;
  });

  const out: GroupMemberImport[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || !row.some((c) => String(c ?? "").trim())) continue;

    const get = (f: keyof GroupMemberImport) => {
      const idx = colMap[f];
      if (idx === undefined) return "";
      const cell = row[idx];
      if (f === "date_of_birth") return formatExcelDate(cell);
      return String(cell ?? "").trim();
    };

    const emailCell = norm(get("email"));
    if (emailCell && emailCell === norm(GROUP_TEMPLATE_EXAMPLE_EMAIL)) continue;

    const m: GroupMemberImport = {
      last_name: get("last_name"),
      first_name: get("first_name"),
      date_of_birth: get("date_of_birth"),
      gender: get("gender"),
      nationality: get("nationality"),
      country_of_residence: get("country_of_residence"),
      email: get("email"),
      phone: get("phone"),
      passport_or_id: get("passport_or_id"),
      address: get("address") || ""
    };
    if (!m.last_name && !m.first_name) continue;
    out.push(m);
  }
  return out;
}
