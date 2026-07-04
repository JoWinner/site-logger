import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseImportFile } from "@/lib/imports/parse-workbook";

describe("parseImportFile", () => {
  it("reads CSV employee rows with optional IDs", async () => {
    const file = new File(
      [
        [
          "Employee Name,Employee ID / PIN,Trade / Role,Crew,Active",
          "Marcus Hill,E001,Carpenter,Crew A,Yes",
          "Daniel Reyes,,Mason,Crew B,No",
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
          crew: "Crew A",
          isActive: "Yes",
        },
      },
      {
        rowNumber: 3,
        values: {
          fullName: "Daniel Reyes",
          employeeIdPin: null,
          tradeRole: "Mason",
          crew: "Crew B",
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
    sheet.addRow(["Employee Name", "Employee ID", "Trade", "Crew"]);
    sheet.addRow(["Andre Cole", "E003", "Electrician", "Crew C"]);
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
          crew: "Crew C",
        },
      },
    ]);
  });
});
