export function PrintableBadge({
  employeeName,
  employeeIdPin,
  qrDataUrl,
}: {
  employeeName: string;
  employeeIdPin: string | null;
  qrDataUrl: string | null;
}) {
  return (
    <article className="employee-badge">
      <header>
        <span>Site Logger</span>
        <strong>Employee attendance</strong>
      </header>
      <div className="employee-badge__qr">
        {qrDataUrl ? (
          // The generated data URL never leaves the current browser session.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Attendance QR for ${employeeName}`}
            height={600}
            src={qrDataUrl}
            width={600}
          />
        ) : (
          <span>QR not issued in this session</span>
        )}
      </div>
      <h2>{employeeName}</h2>
      <p>{employeeIdPin ?? "Employee ID / PIN not assigned"}</p>
    </article>
  );
}
