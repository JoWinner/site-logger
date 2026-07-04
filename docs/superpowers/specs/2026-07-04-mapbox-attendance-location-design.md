# Mapbox Attendance Location Design

## Purpose

Keep browser GPS coordinates as primary evidence while adding a human-readable
place label such as a street, neighbourhood, station area, or locality.
Reverse geocoding is an estimate and must never be represented as proof that a
worker was inside a permitted site boundary.

## Configuration

Mapbox access remains server-only:

- `MAPBOX_ACCESS_TOKEN`
- `MAPBOX_GEOCODING_MODE=temporary|permanent`

The access token is never exposed through a `NEXT_PUBLIC_` variable or returned
to the browser.

## Temporary Testing Mode

Temporary Mapbox responses are not stored or cached. GPS coordinates, accuracy,
and capture time continue to be stored as attendance evidence.

When a ledger or preview needs a label for a record that has no permanent label,
the server resolves only the records on the current page and returns those
labels for that response. The temporary labels are discarded after rendering.
Failure to resolve a temporary label falls back to coordinates and accuracy.

## Permanent Production Mode

The server calls Mapbox reverse geocoding with `permanent=true` after it validates
the fresh browser GPS reading. The attendance event stores:

- Resolved place label
- Mapbox feature identifier when available
- Resolution timestamp
- Resolution status

Attendance sessions snapshot the check-in and check-out labels for fast ledger
display. The immutable event remains the source of truth. Existing coordinate
and accuracy fields are retained.

A Mapbox outage must not lose a legitimate scan. The scan is recorded with
coordinates and an `unresolved` status, the UI shows the fallback coordinates,
and a later permanent resolution can fill only the location metadata without
changing scan time, employee, site, or GPS coordinates.

The event immutability trigger will permit only this narrow transition:
previously empty resolution metadata may become a resolved label, feature ID,
status, and timestamp. It continues to reject changes to every original scan
field and rejects replacement of already-resolved metadata.

## Selection and Display

The resolver chooses the most specific useful result supplied by Mapbox, then
falls back through neighbourhood, locality, place, region, and country context.
The UI shows:

`Resolved place label`

`latitude, longitude · ±accuracy m`

Attendance tables show the check-in label. The quick preview and full attendance
page show both check-in and check-out labels. A compact Mapbox-backed map preview
in the dialog provides geographic context and required attribution.

## Timekeeper Identity

Attendance queries collect the unique `check_in_by` and `check_out_by` profile
IDs, fetch their permitted profile records, and map them to display names.
The UI presents `Display Name · short-user-id`. Missing/deactivated profiles
fall back safely to the short ID.

## Database Changes

A migration adds nullable location-label, feature-ID, resolution-status, and
resolution-time fields to attendance events and sessions. The attendance scan
function accepts optional resolved metadata and applies it only to the event
being recorded. Policies remain unchanged because the existing role rules
already govern attendance evidence.

## Verification

- Resolver tests use recorded Mapbox-shaped fixtures, never live paid requests.
- Scan tests cover permanent success, unresolved fallback, and temporary mode.
- Database tests prove location metadata cannot alter immutable scan evidence.
- UI tests cover long labels, missing labels, coordinates, accuracy, attribution,
  and timekeeper display names.
