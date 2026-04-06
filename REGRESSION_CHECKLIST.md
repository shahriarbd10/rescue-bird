# Rescue Bird Regression Checklist

## 1) Auth & Account Safety
- Register a new user and verify OTP flow works end-to-end.
- Confirm duplicate verified email cannot re-register (expects `409`).
- Confirm login rate limit triggers after repeated wrong passwords.
- Confirm resend OTP rate limit triggers for repeated requests.

## 2) Authorization Boundaries
- Confirm public registration cannot create `admin`/`rescue_team`/`team_staff`.
- Confirm team member cannot accept/resolve alerts assigned to other teams.
- Confirm normal user cannot access `/api/admin/*` endpoints.
- Confirm user can only message teams assigned to their alerts.

## 3) Alert Lifecycle & Dispatch
- Create alerts with each priority (`low`, `medium`, `high`, `critical`).
- Verify open alert can be accepted, then resolved.
- Verify resolved alert cannot be accepted/resolved again.
- Verify escalation changes assigned team when fallback exists.
- Verify `needsManualDispatch` is set when fallback teams are exhausted.

## 4) Data Validation
- Submit invalid `lat/lng` values (out of range) and confirm `400`.
- Upload audio file larger than 10 MB and confirm `400`.
- Submit very long location search query and confirm `400`.

## 5) Realtime Operations
- Open dashboard in 2 browser tabs with same user.
- Create/accept/resolve alert in tab A and confirm tab B auto-refreshes.
- Send message in tab A and confirm messages update in tab B.

## 6) Admin Intelligence
- Open admin tab and confirm metrics load.
- Confirm hotspot list renders from recent alerts.
- Confirm alert timeline renders with priority/status.
- Download CSV exports for alerts/messages/users and validate columns.

## 7) Build & Quality Gate
- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
