function safeTitle(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function badgePrintTitle(employeeName: string): string {
  return `${safeTitle(employeeName) || "Employee"} - QR Badge`;
}

export function bulkBadgePrintTitle(date = new Date()): string {
  return `Employee QR Badges - ${date.toISOString().slice(0, 10)}`;
}
