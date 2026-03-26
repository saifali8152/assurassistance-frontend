import * as XLSX from "xlsx";

/** Template headers (row 1) — matches product spec */
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

/** Map messy header → field */
function headerToField(header: string): keyof GroupMemberImport | null {
  const h = norm(header);
  if (h === "surname" || (h.includes("surname") && !h.includes("given"))) return "last_name";
  if (h.includes("given") && h.includes("name")) return "first_name";
  if (h.includes("date") && h.includes("birth")) return "date_of_birth";
  if (h === "gender" || h.includes("sex")) return "gender";
  if (h.includes("nationality")) return "nationality";
  if (h.includes("country") && h.includes("residence")) return "country_of_residence";
  if (h.includes("email")) return "email";
  if (h.includes("telephone") || h.includes("phone") || h === "tel" || h.includes("mobile"))
    return "phone";
  if (h.includes("passport") || h.includes("id n") || h.includes("id no")) return "passport_or_id";
  if (h.includes("address")) return "address";
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
  return String(v).trim();
}

export function downloadGroupTemplateFile() {
  const ws = XLSX.utils.aoa_to_sheet([GROUP_EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Travellers");
  XLSX.writeFile(wb, "group-travellers-template.xlsx");
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
