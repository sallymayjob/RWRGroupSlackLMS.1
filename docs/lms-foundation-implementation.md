# LMS Foundation Implementation (LMS-001 → LMS-002 → LMS-003 → LMS-004 → LMS-008)

This repository now includes a runnable foundation slice implementing:

- **LMS-001**: Apps Script-oriented project/module structure under `src/`.
- **LMS-002**: Settings bootstrap + secure key-loading utility in `src/services/configService.js`.
- **LMS-003**: Slack signature and timestamp verification in `src/web/requestVerifier.js`.
- **LMS-004**: Webhook ingress and acknowledgement strategy in `src/web/doPost.js`.
- **LMS-008**: Request normalization and routing in `src/web/router.js`.

## Quick validation

Run:

```bash
npm test
```

The smoke tests verify settings bootstrapping, signature verification, and end-to-end slash command routing with a verified Slack request.
