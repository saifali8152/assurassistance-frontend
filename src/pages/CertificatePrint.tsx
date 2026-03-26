import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { i18n as I18nType } from "i18next";
import { getCertificatePageDataApi, getCertificatePageDataPublicApi } from "../api/salesApi";
import { Printer } from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";

export interface CertificatePageData {
  certificateNumber: string;
  policyNumber: string;
  invoiceNumber: string | null;
  issuedOn: string;
  productType: string;
  traveller: {
    givenNames: string;
    surname: string;
    fullName: string;
    dateOfBirth: string;
    passportOrId: string;
    gender: string;
    nationality: string;
    countryOfResidence: string;
  };
  coverage: {
    periodFrom: string;
    periodTo: string;
    stayDays: number;
    validityDays: number;
    destinations: string;
    email: string;
    phone: string;
    planName: string;
    currency: string;
    worldwideLabel: string;
  };
  pricing: {
    basePremium: number | null;
    ageBand: string | null;
    ageMultiplier: number | null;
    planPremium: number;
    guaranteesTotal: number;
    premiumAmount: number;
    tax: number;
    total: number;
    storedPlanPrice: number;
    pricingNote: string | null;
  };
  benefits: {
    category: string;
    categoryHeader: string;
    coverageType?: string | null;
    benefit: string;
    level: string | number;
  }[];
  qrDataUrl: string;
  publicViewUrl?: string;
  contact?: {
    emergencyHelpline: string;
    generalLine: string;
    whatsapp: string;
    websiteUrl: string;
  };
  footer: { line1: string };
}

function FieldInline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="cert-inline-field">
      <span className="cert-lbl-i">{label}:</span>{" "}
      <span className="cert-val-i">{children}</span>
    </span>
  );
}

function websiteHref(url: string) {
  if (!url?.trim()) return "#";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `https://${u}`;
}

function websiteDisplay(url: string) {
  return (url || "").trim().replace(/^https?:\/\//i, "").replace(/\/$/, "") || "—";
}

function fmtNum(n: string | number, locale: string) {
  if (n === "—" || n === "") return "—";
  const x = Number(n);
  if (Number.isNaN(x)) return String(n);
  const loc = locale.startsWith("fr") ? "fr-FR" : "en-US";
  return x.toLocaleString(loc);
}

function categoryDisplayKey(header: string): "Medical" | "Trip" | "Legal" | null {
  if (header === "MEDICAL") return "Medical";
  if (header === "TRIP PROTECTION") return "Trip";
  if (header === "LEGAL") return "Legal";
  return null;
}

/** Matches backend `documentController` COVERAGE_LABELS + plan guarantee rows */
const COVERAGE_TYPE_KEYS = [
  "medicalEmergencies",
  "medicalTransport",
  "hospitalization",
  "evacuationRepatriation",
  "bodyRepatriation",
  "tripCancellation",
  "baggageDeliveryDelay",
  "passportLoss",
  "civilLiability",
  "legalAssistance",
  "bail"
] as const;

/** English labels from API when `benefit` is set but `coverageType` is missing or wrong */
const EN_LABEL_TO_COVERAGE_KEY: Record<string, string> = {
  "Medical emergencies": "medicalEmergencies",
  "Medical transport": "medicalTransport",
  Hospitalization: "hospitalization",
  "Evacuation / repatriation": "evacuationRepatriation",
  "Repatriation of remains": "bodyRepatriation",
  "Trip cancellation": "tripCancellation",
  "Baggage / delivery delay": "baggageDeliveryDelay",
  "Passport loss": "passportLoss",
  "Civil liability": "civilLiability",
  "Legal assistance": "legalAssistance",
  Bail: "bail"
};

function translateBenefitLabel(
  row: { coverageType?: string | null; benefit: string },
  t: TFunction,
  i18n: I18nType
): string {
  const ct = row.coverageType?.trim() ?? "";
  const benefit = row.benefit?.trim() ?? "";

  if (COVERAGE_TYPE_KEYS.includes(ct as (typeof COVERAGE_TYPE_KEYS)[number])) {
    return t(`plan.${ct}`);
  }
  if (ct && i18n.exists(`plan.${ct}`)) {
    return t(`plan.${ct}`);
  }

  const keyFromBenefit = benefit ? EN_LABEL_TO_COVERAGE_KEY[benefit] : undefined;
  if (keyFromBenefit) {
    return t(`plan.${keyFromBenefit}`);
  }

  const keyFromCt = ct ? EN_LABEL_TO_COVERAGE_KEY[ct] : undefined;
  if (keyFromCt) {
    return t(`plan.${keyFromCt}`);
  }

  for (const key of COVERAGE_TYPE_KEYS) {
    const localized = t(`plan.${key}`);
    if (localized === ct || localized === benefit) {
      return localized;
    }
  }

  if (benefit) return benefit;
  if (ct) return ct;
  return "—";
}

const MAIN_LOGO = "/full-logo.png";
const PARTNER_LOGO = "/certificate-partner-logo.svg";

const CertificatePrint: React.FC = () => {
  const { saleId, publicToken } = useParams<{ saleId?: string; publicToken?: string }>();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<CertificatePageData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const locale = i18n.language || "en";

  useEffect(() => {
    if (!publicToken && !saleId) return;
    let cancelled = false;
    setLoadError(false);
    (async () => {
      try {
        const res = publicToken
          ? await getCertificatePageDataPublicApi(publicToken)
          : await getCertificatePageDataApi(Number(saleId));
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [saleId, publicToken]);

  const benefitGroups = useMemo(() => {
    if (!data?.benefits?.length) return [];
    const order = ["MEDICAL", "TRIP PROTECTION", "LEGAL"];
    const map = new Map<string, typeof data.benefits>();
    for (const b of data.benefits) {
      const h = b.categoryHeader || b.category;
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(b);
    }
    return order.filter((k) => map.has(k)).map((k) => ({ header: k, rows: map.get(k)! }));
  }, [data]);

  const categoryLabel = (header: string) => {
    const key = categoryDisplayKey(header);
    if (key === "Medical") return t("certificatePrint.categoryMedical");
    if (key === "Trip") return t("certificatePrint.categoryTrip");
    if (key === "Legal") return t("certificatePrint.categoryLegal");
    return header;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white cert-print-root">
        <div className="w-10 h-10 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin" />
      </div>
    );
  }
  if (loadError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white cert-print-root">
        <p className="text-[#2B2B2B]">
          {loadError ? t("certificatePrint.loadError") : t("certificatePrint.notFound")}
        </p>
      </div>
    );
  }

  const cur = data.coverage.currency === "XOF" ? "FCFA" : data.coverage.currency;
  const scopeLabel = t("certificatePrint.worldwide");
  const contact = data.contact ?? {
    emergencyHelpline: "+91 62916 62954",
    generalLine: "",
    whatsapp: "",
    websiteUrl: "https://www.assurassistance.org"
  };

  return (
    <div className="certificate-shell cert-print-root bg-white min-h-screen py-1 print:py-0">
      <style>{`
        .cert-print-root {
          font-family: Arial, Helvetica, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page { size: A4; margin: 10mm; }
        @media print {
          .no-print { display: none !important; }
          .certificate-shell { background: white !important; padding: 0 !important; }
          .cert-doc-max { max-width: none !important; width: 100%; }
          .cert-doc {
            box-shadow: none !important;
            max-width: none !important;
            padding: 0 !important;
          }
        }
        .cert-doc-max { max-width: min(1080px, calc(100vw - 24px)); }
        .cert-doc { color: #000; font-size: 10px; line-height: 1.2; width: 100%; }
        .cert-main-title {
          color: #E4590F;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.03em;
          line-height: 1.05;
          text-transform: uppercase;
          margin: 0;
        }
        .cert-subtitle { font-size: 10px; margin: 2px 0 0; color: #000; font-weight: 400; }
        .cert-orange-line { height: 2px; background: #E4590F; width: 100%; margin: 4px 0 5px; border: none; }
        .cert-gray-line { height: 1px; background: #E0E0E0; width: 100%; margin: 5px 0; border: none; }
        .cert-intro { margin: 0 0 5px; font-size: 10px; }
        .cert-inline-field { display: inline; }
        .cert-lbl-i { font-size: 9px; font-style: italic; color: #222; }
        .cert-val-i { font-size: 10px; font-weight: 700; }
        /* Insured / coverage / pricing: horizontal rules only (no vertical borders) */
        .cert-split-table { width: 100%; border-collapse: collapse; margin: 0 0 6px; }
        .cert-split-table td {
          border: none;
          border-bottom: 1px solid #E0E0E0;
          padding: 2px 10px 2px 0;
          vertical-align: middle;
          width: 50%;
        }
        .cert-split-table td + td { padding-left: 10px; padding-right: 0; }
        .cert-split-table td[colspan="2"] {
          width: 100%;
          padding-left: 0;
          padding-right: 0;
        }
        .cert-split-table tr:last-child td { border-bottom: 1px solid #E0E0E0; }
        .cert-mail-link { color: #1c398e; text-decoration: underline; word-break: break-all; }
        .cert-mail-link:hover { color: #153570; }
        .cert-lbl {
          font-size: 9px;
          font-style: italic;
          color: #222;
          margin-bottom: 4px;
        }
        .cert-val { font-size: 10px; font-weight: 700; }
        .cert-val-normal { font-size: 10px; font-weight: 400; }
        .cert-section-title {
          font-size: 10.5px;
          font-weight: 700;
          margin: 0 0 2px;
          color: #000;
          text-align: left;
        }
        .cert-section-title--spaced { margin-top: 6px; }
        .cert-benefits-table { border-collapse: collapse; width: 100%; font-size: 9px; margin-bottom: 5px; }
        .cert-benefits-table th,
        .cert-benefits-table td { border: 1px solid #E0E0E0; padding: 2px 4px; vertical-align: top; }
        .cert-benefits-table th {
          background: #f5f5f5;
          font-weight: 700;
          font-size: 9px;
          text-align: left;
        }
        .cert-benefits-table .levels { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .cert-cat-cell {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
          font-weight: 700;
          font-size: 9px;
          background: #fafafa;
          width: 26px;
          min-width: 26px;
        }
        .cert-contact-block { margin: 0 0 4px; font-size: 9px; line-height: 1.28; }
        .cert-contact-intro { margin: 0 0 2px; font-weight: 400; }
        .cert-contact-line { margin: 0; padding: 0; line-height: 1.25; }
        .cert-footer-bar { height: 3px; background: #E4590F; width: 100%; margin: 5px 0 4px; }
        .cert-company-footer { font-size: 7px; color: #444; line-height: 1.3; text-align: center; }
      `}</style>

      {/* Screen-only: language + actions */}
      <div className="no-print cert-doc-max mx-auto px-3 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F] text-white hover:bg-[#C94A0D] text-sm"
          >
            <Printer className="w-4 h-4" /> {t("certificatePrint.printSavePdf")}
          </button>
        </div>
        <div className="flex items-center">
          <LanguageSelector />
        </div>
      </div>

      <article className="cert-doc cert-doc-max mx-auto min-h-0 px-3 sm:px-5 pt-0 pb-2 bg-white shadow-md print:shadow-none">
        {/* Header — logos + title */}
        <header className="flex justify-between items-center gap-2 mb-0">
          <div className="shrink-0 flex items-center min-w-[88px]">
            <img
              src={MAIN_LOGO}
              alt="Assur Assistance"
              className="cert-logo-main block max-h-[44px] max-w-[140px] w-auto object-contain object-left"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 text-center px-2 min-w-0">
            <h1 className="cert-main-title">{t("certificatePrint.mainTitle")}</h1>
            <p className="cert-subtitle">{t("certificatePrint.subtitleTravel")}</p>
          </div>
          <div className="shrink-0 flex items-center justify-end min-w-[88px]">
            <img
              src={PARTNER_LOGO}
              alt={t("certificatePrint.partnerLogoAlt")}
              className="cert-logo-partner block max-h-[40px] max-w-[120px] w-auto object-contain object-right"
            />
          </div>
        </header>
        <div className="cert-orange-line" role="presentation" />

        <p className="cert-intro">{t("certificatePrint.intro")}</p>

        <h2 className="cert-section-title">{t("certificate.insured")}</h2>
        <table className="cert-split-table" aria-label={t("certificate.insured")}>
          <tbody>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.givenNames")}>
                  {(data.traveller.givenNames || "—").toUpperCase()}
                </FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.surname")}>
                  {(data.traveller.surname || "—").toUpperCase()}
                </FieldInline>
              </td>
            </tr>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.dateOfBirth")}>
                  {data.traveller.dateOfBirth || "—"}
                </FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.passportNo")}>
                  {data.traveller.passportOrId || "—"}
                </FieldInline>
              </td>
            </tr>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.gender")}>{data.traveller.gender || "—"}</FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.nationality")}>
                  {data.traveller.nationality || "—"}
                </FieldInline>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <FieldInline label={t("certificatePrint.countryOfResidence")}>
                  {data.traveller.countryOfResidence || "—"}
                </FieldInline>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="cert-section-title cert-section-title--spaced">
          {t("certificatePrint.coverageDetails", { scope: scopeLabel })}
        </h2>
        <table className="cert-split-table">
          <tbody>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.periodOfStay")}>
                  {t("certificatePrint.periodOneLine", {
                    from: data.coverage.periodFrom,
                    to: data.coverage.periodTo
                  })}
                </FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.stayDays")}>{data.coverage.stayDays}</FieldInline>
              </td>
            </tr>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.destinations")}>
                  {(data.coverage.destinations || "—").toUpperCase()}
                </FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.validityDays")}>
                  {data.coverage.validityDays}
                </FieldInline>
              </td>
            </tr>
            <tr>
              <td>
                <span className="cert-inline-field">
                  <span className="cert-lbl-i">{t("certificatePrint.email")}:</span>{" "}
                  {data.coverage.email ? (
                    <a href={`mailto:${data.coverage.email}`} className="cert-mail-link cert-val-i">
                      {data.coverage.email}
                    </a>
                  ) : (
                    <span className="cert-val-i">—</span>
                  )}
                </span>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.phoneNumber")}>
                  {data.coverage.phone || "—"}
                </FieldInline>
              </td>
            </tr>
            <tr>
              <td>
                <FieldInline label={t("certificatePrint.plan")}>{data.coverage.planName}</FieldInline>
              </td>
              <td>
                <FieldInline label={t("certificatePrint.currency")}>{cur}</FieldInline>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Age rating only (no premium amounts on certificate) */}
        {(data.pricing.ageMultiplier != null ||
          (data.pricing.ageBand != null && String(data.pricing.ageBand).trim() !== "")) && (
          <>
            <h2 className="cert-section-title cert-section-title--spaced">
              {t("certificatePrint.ageSectionTitle")}
            </h2>
            <table className="cert-split-table">
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <FieldInline
                      label={t("certificatePrint.ageAdjustment", {
                        mult: data.pricing.ageMultiplier ?? 1
                      })}
                    >
                      {data.pricing.ageBand?.trim() || "—"}
                    </FieldInline>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}
        {data.pricing.pricingNote && (
          <p className="text-red-600 text-[10px] mb-1">{data.pricing.pricingNote}</p>
        )}

        <p className="mb-0.5 mt-0.5" style={{ fontSize: 10 }}>
          {t("certificatePrint.benefitsIntro")}
        </p>

        <table className="cert-benefits-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}>{t("certificatePrint.colTravel")}</th>
              <th>{t("certificatePrint.colBenefits")}</th>
              <th className="levels" style={{ width: 100 }}>
                {t("certificatePrint.colLevels")}
              </th>
            </tr>
          </thead>
          <tbody>
            {benefitGroups.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-gray-500 py-4">
                  {t("certificatePrint.noBenefits")}
                </td>
              </tr>
            ) : (
              benefitGroups.map((g) =>
                g.rows.map((row, i) => (
                  <tr key={`${g.header}-${i}`}>
                    {i === 0 ? (
                      <td rowSpan={g.rows.length} className="cert-cat-cell">
                        {categoryLabel(g.header)}
                      </td>
                    ) : null}
                    <td>{translateBenefitLabel(row, t, i18n)}</td>
                    <td className="levels">{fmtNum(row.level, locale)}</td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>

        <div className="cert-contact-block">
          <p className="cert-contact-intro">{t("certificatePrint.contactIntro")}</p>
          <p className="cert-contact-line">
            - {t("certificatePrint.contactDedicated", { phone: contact.emergencyHelpline })}
          </p>
          <p className="cert-contact-line">
            - {t("certificatePrint.contactGeneral", { phone: contact.generalLine || "—" })}
          </p>
          <p className="cert-contact-line">
            - {t("certificatePrint.contactWhatsapp", { phone: contact.whatsapp || "—" })}
          </p>
          <p className="cert-contact-line">
            - {t("certificatePrint.ourWebsite")}{" "}
            <a
              href={websiteHref(contact.websiteUrl)}
              className="cert-mail-link"
              style={{ fontWeight: 400 }}
            >
              {websiteDisplay(contact.websiteUrl)}
            </a>
          </p>
        </div>

        <div className="cert-gray-line" role="presentation" />

        <div className="space-y-0 mb-1" style={{ fontSize: 10 }}>
          <div>
            <span className="font-bold">{t("certificatePrint.certificateNo")}</span>{" "}
            {data.certificateNumber}
          </div>
          <div>
            <span className="font-bold">{t("certificatePrint.policyNo")}</span> {data.policyNumber}
          </div>
          {data.invoiceNumber && (
            <div>
              <span className="font-bold">{t("certificatePrint.invoiceNo")}</span> {data.invoiceNumber}
            </div>
          )}
        </div>

        <div className="flex justify-between items-end gap-3 mb-1">
          <div>
            <p className="mb-0.5" style={{ fontSize: 9 }}>
              {t("certificatePrint.authQrCaption")}
            </p>
            {data.qrDataUrl ? (
              <img
                src={data.qrDataUrl}
                alt=""
                className="w-[88px] h-[88px] border border-[#E0E0E0] object-contain"
              />
            ) : (
              <div className="w-[88px] h-[88px] bg-[#f5f5f5] border border-[#E0E0E0]" />
            )}
          </div>
          <div className="text-right font-semibold pb-0.5" style={{ fontSize: 10 }}>
            {t("certificatePrint.forAssur")}
          </div>
        </div>

        <p className="text-center mb-0.5" style={{ fontSize: 10 }}>
          {t("certificatePrint.issuedLine1", { date: data.issuedOn })}
        </p>
        <p className="text-center mb-0" style={{ fontSize: 9, color: "#333" }}>
          {t("certificatePrint.issuedLine2")}
        </p>

        <div className="cert-footer-bar" role="presentation" />

        <footer className="cert-company-footer">{t("certificatePrint.companyFooter")}</footer>
      </article>
    </div>
  );
};

export default CertificatePrint;
