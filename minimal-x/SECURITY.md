# Security Policy

## Principles

This extension is intentionally minimal.

- No remote code
- No analytics or telemetry
- No external network requests
- No collection of personal data
- Local-only settings via extension storage
- Narrow host permissions for X only

## Threat model

The main security goals are:
- avoid overbroad permissions
- avoid unsafe DOM injection patterns
- avoid third-party dependencies unless necessary

## Reporting issues

If you find a security issue, please report it privately before opening a public issue.

## Secure development notes

- Do not add `eval`, dynamic script loading, or remote assets
- Keep permissions minimal
- Prefer text-only UI injection
- Be careful when matching DOM text so user-generated content is not treated as trusted input
