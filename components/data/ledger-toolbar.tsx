import type { SiteRow } from "@/lib/database.types";

export function LedgerToolbar({
  search,
  sort,
  direction,
  sortOptions,
  sites = [],
  selectedSiteIds = [],
  statusOptions = [],
  status,
  overtime,
  includeDates = false,
  from,
  to,
}: {
  search: string;
  sort: string;
  direction: "asc" | "desc";
  sortOptions: { value: string; label: string }[];
  sites?: SiteRow[];
  selectedSiteIds?: string[];
  statusOptions?: { value: string; label: string }[];
  status?: string | null;
  overtime?: "yes" | "no" | null;
  includeDates?: boolean;
  from?: string | null;
  to?: string | null;
}) {
  return (
    <form className="ledger-toolbar" method="get">
      <label className="field ledger-toolbar__search">
        <span>Search</span>
        <input defaultValue={search} name="q" placeholder="Search records" type="search" />
      </label>
      {sites.length ? (
        <label className="field">
          <span>Site</span>
          <select defaultValue={selectedSiteIds[0] ?? ""} name="site">
            <option value="">All sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
      ) : null}
      {statusOptions.length ? (
        <label className="field">
          <span>Status</span>
          <select defaultValue={status ?? ""} name="status">
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {overtime !== undefined ? (
        <label className="field">
          <span>Overtime</span>
          <select defaultValue={overtime ?? ""} name="overtime">
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      ) : null}
      {includeDates ? (
        <>
          <label className="field"><span>From</span><input defaultValue={from ?? ""} name="from" type="date" /></label>
          <label className="field"><span>To</span><input defaultValue={to ?? ""} name="to" type="date" /></label>
        </>
      ) : null}
      <label className="field">
        <span>Sort</span>
        <select defaultValue={sort} name="sort">
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Direction</span>
        <select defaultValue={direction} name="dir">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
      <div className="ledger-toolbar__actions">
        <button className="button button--compact" type="submit">Apply</button>
        <a className="button button--compact" href="?">Clear</a>
      </div>
    </form>
  );
}
