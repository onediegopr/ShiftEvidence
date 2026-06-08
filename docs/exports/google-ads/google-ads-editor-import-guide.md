# Google Ads Editor Import Guide

Date: 2026-06-08

This guide imports the Shift Evidence launch pack manually through Google Ads Editor. It assumes the Google Ads account already exists and that all campaign activation will remain manual after review.

## Files

Import these files in this order:

1. `campaigns.csv`
2. `ad_groups.csv`
3. `keywords.csv`
4. `negative_keywords.csv`
5. `responsive_search_ads.csv`
6. `assets_sitelinks.csv`
7. `assets_callouts.csv`
8. `assets_structured_snippets.csv`

Reference file:

- `shift-evidence-search-build.csv`

## Before Import

- Open Google Ads Editor and download the latest account state for `shiftevidence`.
- Do not post changes yet.
- Keep all imported entities in `Paused`.
- If legacy campaigns exist, pause/remove them manually after reviewing names and before posting new Shift Evidence entities.
- Do not touch billing, users, ownership, tax settings, or payment methods.

## Import Steps

1. Open Google Ads Editor.
2. Select the `shiftevidence` account.
3. Click `Account` -> `Import` -> `From file`.
4. Import `campaigns.csv`.
5. In the field-mapping screen, map columns directly to campaign fields.
6. Confirm every campaign is `Paused` before accepting the import.
7. Repeat the process for `ad_groups.csv`.
8. Repeat the process for `keywords.csv`.
9. Repeat the process for `negative_keywords.csv`.
10. Repeat the process for `responsive_search_ads.csv`.
11. Repeat the process for `assets_sitelinks.csv`.
12. Repeat the process for `assets_callouts.csv`.
13. Repeat the process for `assets_structured_snippets.csv`.
14. Review the account tree for duplicate entities or unexpected language/location mappings.
15. Leave the account unposted until final manual review is complete.

## Mapping Notes

- `Campaign State`, `Ad Group State`, and `Status` should all map to paused/offline entities.
- Locations are stored as semicolon-delimited human-readable country names to make review easier.
- Languages are stored as `English`, `Spanish`, or `English;Spanish`.
- Match types are written as `Phrase`.
- All final URLs point to `https://shiftevidence.com` except sitelinks.
- Negative keywords were expanded from the old pseudo-global list into explicit per-campaign rows so they are importable.

## Manual Review Checklist

- Campaign budgets match the intended split: 8 / 5 / 5 / 2 USD per day.
- Search-only networks are preserved.
- No campaign is enabled.
- No ad is enabled.
- EN and ES campaign separation still matches the launch strategy.
- MSP campaign keeps both English and Spanish targeting.
- Sitelinks point to live pages.
- RSA headlines and descriptions were not truncated during import.
- Legacy campaigns are paused or removed before posting.

## Posting Rule

Do not click `Post` until:

- legacy cleanup is complete,
- imported entities are paused,
- conversion tracking has been reviewed,
- and final approval has been given.
