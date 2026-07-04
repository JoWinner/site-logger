import type { ReactNode } from "react";

export interface ResponsiveColumn<Row> {
  key: string;
  label: string;
  render: (row: Row) => ReactNode;
}

export function ResponsiveTable<Row extends { id: string }>({
  caption,
  columns,
  rows,
  actions,
  emptyMessage,
}: {
  caption: string;
  columns: ResponsiveColumn<Row>[];
  rows: Row[];
  actions?: (row: Row) => ReactNode;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="empty-copy">{emptyMessage}</p>;
  }

  return (
    <div className="responsive-table-wrap">
      <table className="responsive-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            {actions ? <th scope="col">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td data-label={column.label} key={column.key}>
                  {column.render(row)}
                </td>
              ))}
              {actions ? (
                <td className="responsive-table__actions" data-label="Actions">
                  {actions(row)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
