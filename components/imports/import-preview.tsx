import type {
  ImportPreview,
  ImportValue,
} from "@/lib/imports/types";

function recordLabel(value: ImportValue | null): string {
  if (!value) return "Invalid row";
  if ("fullName" in value) return value.fullName;
  return `${value.siteCode} · ${value.name}`;
}

export function ImportPreviewTable({
  preview,
}: {
  preview: ImportPreview<ImportValue>;
}) {
  return (
    <div className="import-preview">
      <div className="import-summary" aria-label="Import summary">
        <span>
          <strong>{preview.summary.new}</strong> new
        </span>
        <span>
          <strong>{preview.summary.update}</strong> updates
        </span>
        <span>
          <strong>{preview.summary.warning}</strong> warnings
        </span>
        <span>
          <strong>{preview.summary.error}</strong> errors
        </span>
      </div>
      <div className="responsive-table-wrap">
        <table className="responsive-table import-preview__table">
          <caption>Import preview</caption>
          <thead>
            <tr>
              <th scope="col">Row</th>
              <th scope="col">Result</th>
              <th scope="col">Record</th>
              <th scope="col">Message</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.rowNumber}>
                <td data-label="Row">{row.rowNumber}</td>
                <td data-label="Result">
                  <span
                    className={`import-disposition import-disposition--${row.disposition}`}
                  >
                    {row.disposition}
                  </span>
                </td>
                <td data-label="Record">
                  {recordLabel(row.value)}
                </td>
                <td data-label="Message">
                  {row.messages.join(" ") || "Ready to import."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
