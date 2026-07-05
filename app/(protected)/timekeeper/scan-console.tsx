"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { QrScanner } from "@/components/scanner/qr-scanner";
import { captureFreshPosition, type GpsEvidence } from "@/lib/attendance/gps";
import type { AttendanceAction, SiteRow } from "@/lib/database.types";

interface ScanResult {
  ok: boolean;
  code: string;
  message?: string;
  employeeName?: string;
  siteName?: string;
}

export function ScanConsole({ site }: { site: SiteRow | null }) {
  const router = useRouter();
  const sites = site ? [site] : [];
  const siteId = site?.id ?? "";
  const [action, setAction] = useState<AttendanceAction>("check_in");
  const [gps, setGps] = useState<GpsEvidence | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function prepareScanner() {
    if (!siteId) {
      setResult({
        ok: false,
        code: "site_assignment_required",
        message: "Ask a Super Admin to assign your Timekeeper account to an active site.",
      });
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const position = await captureFreshPosition();
      setGps(position);
      setScannerOpen(true);
    } catch (error) {
      setResult({
        ok: false,
        code: "gps_required",
        message: error instanceof Error ? error.message : "Location is required.",
      });
    } finally {
      setPending(false);
    }
  }

  const handleDecoded = useCallback(
    async (rawToken: string) => {
      if (!gps || !siteId) return;
      setPending(true);
      setScannerOpen(false);

      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawToken,
          action,
          deviceCapturedAt: new Date().toISOString(),
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyMetres: gps.accuracyMetres,
          locationCapturedAt: gps.capturedAt,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const payload = (await response.json()) as ScanResult;
      setResult(payload);
      setGps(null);
      setPending(false);
      router.refresh();
    },
    [action, gps, router, siteId],
  );

  const handleCameraError = useCallback((message: string) => {
    setScannerOpen(false);
    setResult({ ok: false, code: "camera_error", message });
  }, []);

  return (
    <section className="scan-console">
      <div className="scan-console__controls">
        <label className="field">
          <span>Current site</span>
          <select aria-readonly="true" disabled value={siteId}>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_code} · {site.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="action-switch" disabled={scannerOpen || pending}>
          <legend>Attendance action</legend>
          <button
            className={action === "check_in" ? "is-selected" : ""}
            onClick={() => setAction("check_in")}
            type="button"
          >
            Check in
          </button>
          <button
            className={action === "check_out" ? "is-selected" : ""}
            onClick={() => setAction("check_out")}
            type="button"
          >
            Check out
          </button>
        </fieldset>
        {!scannerOpen ? (
          <button className="scan-trigger" disabled={pending || !site} onClick={prepareScanner} type="button">
            <span>{pending ? "Locating…" : "Capture GPS & scan"}</span>
            <strong>{action === "check_in" ? "IN" : "OUT"}</strong>
          </button>
        ) : null}
        {gps ? (
          <p className="gps-proof">
            GPS captured · ±{Math.round(gps.accuracyMetres)} m
          </p>
        ) : null}
      </div>

      <div className="scan-console__stage">
        {scannerOpen ? (
          <QrScanner onDecoded={handleDecoded} onError={handleCameraError} />
        ) : result ? (
          <article className={`scan-result ${result.ok ? "scan-result--ok" : "scan-result--error"}`} role="status">
            <span>{result.ok ? "Recorded" : "Not recorded"}</span>
            <h2>{result.employeeName ?? result.message}</h2>
            {result.ok ? <p>{result.siteName} · {action === "check_in" ? "Check in" : "Check out"}</p> : null}
          </article>
        ) : (
          <article className="scan-idle">
            <span>Ready</span>
            <h2>{site ? "Choose an action, then capture GPS." : "A site assignment is required before scanning."}</h2>
          </article>
        )}
      </div>
    </section>
  );
}
