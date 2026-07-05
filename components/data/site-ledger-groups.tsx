import type { ReactNode } from "react";

import type { SiteLedgerGroup } from "@/lib/tables/query-state";

export function SiteLedgerGroups<Row>({
  groups,
  render,
}: {
  groups: SiteLedgerGroup<Row>[];
  render: (group: SiteLedgerGroup<Row>) => ReactNode;
}) {
  if (!groups.length) {
    return <p className="empty-copy">No records match these filters.</p>;
  }

  return (
    <div className="site-ledger-groups">
      {groups.map((group) => (
        <details className="site-ledger-group" key={group.key} open>
          <summary>
            <strong>{group.label}</strong>
            <span>{group.rows.length} records</span>
          </summary>
          <div className="site-ledger-group__body">{render(group)}</div>
        </details>
      ))}
    </div>
  );
}
