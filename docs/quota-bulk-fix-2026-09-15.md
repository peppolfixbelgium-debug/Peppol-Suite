# Bulk quota fix evidence — 2026-09-15

- Bulk allowance is defined as document units, not batch/job count.
- Each successfully saved document in a bulk upload now uses one `bulk_used` unit.
- Bulk history records use `kind: bulk` and therefore do not consume the normal conversion quota.
- Quota increment and history insertion are atomic in `api/conversions.ts`.
- Bulk UI reads and displays the separate bulk allowance.
- Regression coverage verifies one-document increment and quota-limit blocking.
- Implementation commits: `a3ce3e3c1ebf2dfa566b36505bcfebf4a72e16c3`, `b0550faab0fceca3de071339dc08dc2696bf8180`, `c6cffc8f546f195fa583afb271c9f8169659f8f`, `42e8a1022cd6b0206dd76318bef8259bde5726eb`, `9ea972bd34bb1706e3603277c3f656ca7ad90dc8`, followed by state/evidence documentation commits.
- CI workflow lookup for the latest quota-fix commit returned no workflow runs; no CI GREEN claim is made.
