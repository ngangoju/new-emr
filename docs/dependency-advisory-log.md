# Dependency Advisory Log

This document records accepted security vulnerabilities or advisories where immediate upgrading is blocked by upstream dependencies, but the risk has been analyzed and accepted.

## Accepted Advisories

### 1. `exceljs` Dependency Vulnerability (`uuid`)

- **Vulnerability ID:** GHSA-h9rv-jmmf-4j8q / CVE-2021-3749 (or equivalent `uuid` advisory)
- **Severity:** Moderate
- **Dependency Path:** `new-emr` -> `exceljs` -> `uuid`
- **Description:** A vulnerability in `uuid` package versions prior to 3.x/8.x where insecure random number generators could be used if global variables were modified.
- **Risk Analysis & Impact:**
  - `exceljs` is used solely in the EMR frontend to parse and generate Excel workbooks for clinical reports/invoices.
  - The vulnerable `uuid` code is not exposed to client-facing auth tokens or cryptographic key generation.
  - The risk of exploitation within the local web browser session during standard Excel sheet export/import is negligible.
- **Mitigation/Workaround:** Keep `exceljs` updated to the latest stable version. We will monitor the upstream `exceljs` repository for a release that replaces or updates the underlying `uuid` dependency.
- **Decision:** Accepted risk.
- **Next Review Date:** Q3 2026
