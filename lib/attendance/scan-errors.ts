const SCAN_ERRORS: Record<string, string> = {
  invalid_qr: "This QR badge is invalid or has been replaced.",
  revoked_qr: "This QR badge has been revoked. Issue a new badge.",
  inactive_employee: "This employee is inactive and cannot be scanned.",
  site_assignment_required:
    "Your Timekeeper account needs an active site assignment.",
  gps_required: "A fresh device location is required. Capture location again.",
  already_checked_in: "This employee is already checked in.",
  no_open_session: "This employee has no open check-in to close.",
  duplicate_request: "This scan was already submitted.",
  not_authorized: "Your account is not authorized to record attendance.",
};

export function getScanErrorMessage(code: string): string {
  return (
    SCAN_ERRORS[code] ?? "The scan could not be recorded. Try again."
  );
}
