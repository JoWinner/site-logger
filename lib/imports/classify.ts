import type {
  ImportPreviewRow,
  ParsedImportRow,
} from "@/lib/imports/types";
import type { EmployeeRow, SiteRow } from "@/lib/database.types";
import {
  employeeInputSchema,
  type EmployeeInput,
} from "@/lib/validation/employee";
import { siteInputSchema, type SiteInput } from "@/lib/validation/site";

function optionalString(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function activeValue(value: unknown): boolean | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  if (["true", "yes", "y", "1", "active"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(normalized)) return false;
  return null;
}

function issueMessages(
  issues: { path: PropertyKey[]; message: string }[],
): string[] {
  return issues.map((issue) => {
    const field = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${field}${issue.message}`;
  });
}

export function classifyEmployeeRows(
  rows: ParsedImportRow[],
  existing: EmployeeRow[],
  sites: SiteRow[],
): ImportPreviewRow<EmployeeInput>[] {
  const byId = new Map(
    existing
      .filter((employee) => employee.employee_id_pin)
      .map((employee) => [
        employee.employee_id_pin!.toLowerCase(),
        employee,
      ]),
  );
  const names = new Set(
    existing.map((employee) => employee.full_name.trim().toLowerCase()),
  );
  const sitesByCode = new Map(
    sites.map((site) => [site.site_code.trim().toLowerCase(), site]),
  );
  const sitesByName = new Map<string, SiteRow[]>();
  for (const site of sites) {
    const key = site.name.trim().toLowerCase();
    sitesByName.set(key, [...(sitesByName.get(key) ?? []), site]);
  }

  return rows.map((row) => {
    const isActive = activeValue(row.values.isActive);
    if (isActive === null) {
      return {
        rowNumber: row.rowNumber,
        disposition: "error",
        value: null,
        messages: ["Active must be Yes/No, True/False, 1/0, or Active/Inactive."],
      };
    }

    const siteCode = optionalString(row.values.siteCode)?.toLowerCase();
    const siteName = optionalString(row.values.siteName)?.toLowerCase();
    const codeMatch = siteCode ? sitesByCode.get(siteCode) : undefined;
    const nameMatches = siteName ? sitesByName.get(siteName) ?? [] : [];
    if (
      (siteCode && !codeMatch)
      || (siteName && nameMatches.length !== 1)
      || (codeMatch && nameMatches.length === 1 && codeMatch.id !== nameMatches[0].id)
    ) {
      return {
        rowNumber: row.rowNumber,
        disposition: "error",
        value: null,
        messages: ["Current Site does not match one available site."],
      };
    }
    const currentSiteId = codeMatch?.id ?? nameMatches[0]?.id ?? null;

    const parsed = employeeInputSchema.safeParse({
      fullName: optionalString(row.values.fullName),
      employeeIdPin: optionalString(row.values.employeeIdPin),
      tradeRole: optionalString(row.values.tradeRole),
      currentSiteId,
      isActive,
    });

    if (!parsed.success) {
      return {
        rowNumber: row.rowNumber,
        disposition: "error",
        value: null,
        messages: issueMessages(parsed.error.issues),
      };
    }

    const idKey = parsed.data.employeeIdPin?.toLowerCase();
    if (idKey && byId.has(idKey)) {
      return {
        rowNumber: row.rowNumber,
        disposition: "update",
        value: parsed.data,
        messages: ["Existing Employee ID/PIN will be updated."],
      };
    }

    if (
      !parsed.data.employeeIdPin &&
      names.has(parsed.data.fullName.toLowerCase())
    ) {
      return {
        rowNumber: row.rowNumber,
        disposition: "warning",
        value: parsed.data,
        messages: [
          "An employee with the same name exists. This ID-less row will create a new employee.",
        ],
      };
    }

    return {
      rowNumber: row.rowNumber,
      disposition: "new",
      value: parsed.data,
      messages: [],
    };
  });
}

export function classifySiteRows(
  rows: ParsedImportRow[],
  existing: SiteRow[],
): ImportPreviewRow<SiteInput>[] {
  const codes = new Set(existing.map((site) => site.site_code.toLowerCase()));

  return rows.map((row) => {
    const isActive = activeValue(row.values.isActive);
    if (isActive === null) {
      return {
        rowNumber: row.rowNumber,
        disposition: "error",
        value: null,
        messages: ["Active must be Yes/No, True/False, 1/0, or Active/Inactive."],
      };
    }

    const parsed = siteInputSchema.safeParse({
      siteCode: optionalString(row.values.siteCode),
      name: optionalString(row.values.name),
      isActive,
    });

    if (!parsed.success) {
      return {
        rowNumber: row.rowNumber,
        disposition: "error",
        value: null,
        messages: issueMessages(parsed.error.issues),
      };
    }

    const updating = codes.has(parsed.data.siteCode.toLowerCase());
    return {
      rowNumber: row.rowNumber,
      disposition: updating ? "update" : "new",
      value: parsed.data,
      messages: updating ? ["Existing Site Code will be updated."] : [],
    };
  });
}
