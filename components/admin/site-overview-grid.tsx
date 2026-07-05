export interface SiteOverviewGroup {
  key: string;
  name: string;
  siteCode: string | null;
  activeEmployees: number;
  sessionsToday: number;
  timekeepers: string[];
}

export function SiteOverviewGrid({
  groups,
}: {
  groups: SiteOverviewGroup[];
}) {
  return (
    <div className="site-overview-grid">
      {groups.map((group) => (
        <article className="site-overview-card" key={group.key}>
          <header>
            <div>
              <span>{group.siteCode ?? "NO SITE"}</span>
              <h2>{group.name}</h2>
            </div>
            <strong>{group.activeEmployees}</strong>
          </header>
          <dl>
            <div>
              <dt>Active employees</dt>
              <dd>{group.activeEmployees}</dd>
            </div>
            <div>
              <dt>Sessions today</dt>
              <dd>{group.sessionsToday}</dd>
            </div>
          </dl>
          <div className="site-overview-card__keepers">
            <span>Timekeepers</span>
            {group.timekeepers.length ? (
              group.timekeepers.map((name) => <strong key={name}>{name}</strong>)
            ) : (
              <em>None assigned</em>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
