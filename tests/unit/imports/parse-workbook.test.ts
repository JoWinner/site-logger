import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseImportFile } from "@/lib/imports/parse-workbook";

describe("parseImportFile", () => {
  it("reads CSV employee rows with optional IDs", async () => {
    const file = new File(
      [
        [
          "Employee Name,Employee ID / PIN,Trade / Role,Site Code,Active",
          "Marcus Hill,E001,Carpenter,ATLAS,Yes",
          "Daniel Reyes,,Mason,,No",
        ].join("\n"),
      ],
      "employees.csv",
      { type: "text/csv" },
    );

    const rows = await parseImportFile(file, "employees");

    expect(rows).toEqual([
      {
        rowNumber: 2,
        values: {
          fullName: "Marcus Hill",
          employeeIdPin: "E001",
          tradeRole: "Carpenter",
          siteCode: "ATLAS",
          isActive: "Yes",
        },
      },
      {
        rowNumber: 3,
        values: {
          fullName: "Daniel Reyes",
          employeeIdPin: null,
          tradeRole: "Mason",
          siteCode: null,
          isActive: "No",
        },
      },
    ]);
  });

  it("finds a header row inside the first XLSX worksheet", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Employees");
    sheet.addRow(["Company employee import"]);
    sheet.addRow([]);
    sheet.addRow(["Review before upload"]);
    sheet.addRow(["Employee Name", "Employee ID", "Trade", "Site Name"]);
    sheet.addRow(["Andre Cole", "E003", "Electrician", "Atlas"]);
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([buffer], "employees.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const rows = await parseImportFile(file, "employees");

    expect(rows).toEqual([
      {
        rowNumber: 5,
        values: {
          fullName: "Andre Cole",
          employeeIdPin: "E003",
          tradeRole: "Electrician",
          siteName: "Atlas",
        },
      },
    ]);
  });
});
