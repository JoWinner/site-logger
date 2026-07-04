"use client";

import QRCode from "qrcode";
import { useState } from "react";

import { PrintableBadge } from "@/components/attendance/printable-badge";
import { badgePrintTitle } from "@/lib/qr/filenames";

export function EmployeeBadge({
  employeeId,
  employeeName,
  employeeIdPin,
}: {
  employeeId: string;
  employeeName: string;
  employeeIdPin: string | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function issue() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/employees/${employeeId}/qr`, {
      method: "POST",
    });
    const result = (await response.json()) as { rawToken?: string; error?: string };
    if (!response.ok || !result.rawToken) {
      setError(result.error ?? "QR badge could not be issued.");
      setPending(false);
      return;
    }
    setQrDataUrl(
      await QRCode.toDataURL(result.rawToken, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 620,
        color: { dark: "#14251f", light: "#fffef8" },
      }),
    );
    setPending(false);
  }

  function printBadge() {
    const previousTitle = document.title;
    document.title = badgePrintTitle(employeeName);
    window.print();
    document.title = previousTitle;
  }

  return (
    <div className="badge-station">
      <PrintableBadge
        employeeIdPin={employeeIdPin}
        employeeName={employeeName}
        qrDataUrl={qrDataUrl}
      />
      <div className="badge-actions">
        <button className="button button--signal" disabled={pending} onClick={issue} type="button">
          {pending ? "Issuing…" : qrDataUrl ? "Reissue badge" : "Issue badge"}
        </button>
        <button className="button" disabled={!qrDataUrl} onClick={printBadge} type="button">
          Print badge
        </button>
        {error ? <p className="form-error">{error}</p> : null}
        <p className="form-note">
          Reissuing immediately revokes the previous badge. Print before leaving this page.
        </p>
      </div>
    </div>
  );
}
