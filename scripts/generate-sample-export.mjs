import fs from "node:fs/promises";
import path from "node:path";

import { buildAttendanceWorkbook } from "../lib/exports/attendance-workbook.ts";

const outputDirectory = path.resolve("outputs/sample");
await fs.mkdir(outputDirectory, { recursive: true });

const rows = [
  {
    workDate: "2026-06-24",
    employeeName: "Marcus Hill",
    employeeIdPin: "E001",
    siteName: "Atlas",
    checkInAt: "2026-06-24T07:00:00.000Z",
    checkOutAt: "2026-06-24T16:00:00.000Z",
    workedMinutes: 540,
    checkInLatitude: 64.1466,
    checkInLongitude: -21.9426,
    checkInAccuracyMetres: 18,
    checkOutLatitude: 64.1467,
    checkOutLongitude: -21.9424,
    checkOutAccuracyMetres: 20,
    checkInBy: "Site Keeper",
    checkOutBy: "Site Keeper",
    overtimeCheck: null,
    assignmentCheck: null,
    payrollStatus: null,
    notes: null,
    status: "complete",
  },
  {
    workDate: "2026-06-24",
    employeeName: "Luis Rivera",
    employeeIdPin: null,
    siteName: "The Dunes",
    checkInAt: "2026-06-24T07:00:00.000Z",
    checkOutAt: "2026-06-24T17:30:00.000Z",
    workedMinutes: 630,
    checkInLatitude: 64.147,
    checkInLongitude: -21.942,
    checkInAccuracyMetres: 24,
    checkOutLatitude: 64.1471,
    checkOutLongitude: -21.9418,
    checkOutAccuracyMetres: 26,
    checkInBy: "Site Keeper",
    checkOutBy: "Site Keeper",
    overtimeCheck: true,
    assignmentCheck: false,
    payrollStatus: "on_hold",
    notes: "Sample row demonstrating a worker without Employee ID / PIN.",
    status: "complete",
  },
];

const workbook = await buildAttendanceWorkbook(rows);
const outputPath = path.join(
  outputDirectory,
  "site-logger-attendance-sample.xlsx",
);
await fs.writeFile(outputPath, new Uint8Array(workbook));
console.log(outputPath);
