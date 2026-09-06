---
name: category-management
description: Guide and scripts to analyze transaction patterns, suggest new categories, and migrate historical transactions in the SQLite database.
---

# Category Management Skill

This skill assists in analyzing transaction titles and merchants from the database, identifying categorization issues, defining new main/sub-categories, and running migrations to reclassify transactions.

## Tools & Scripts Available

In the workspace `scripts/` directory, there are two primary scripts for this purpose:

1. **Analysis Script** (`scripts/deep-analyze.ts`):
   - Scans the database and groups transactions by `o_que_gastei` and `onde`.
   - Displays the most common patterns classified as `OUTROS` and those classified in other categories to help spot misclassifications.
   - Run command:
     ```bash
     npx tsx scripts/deep-analyze.ts
     ```

2. **Migration Script** (`scripts/migrate-categories.ts`):
   - Installs new categories under `SupportItem` (`type: 'LINKED_CATEGORY'`).
   - Updates target expense types in `SupportItem` (`type: 'CATEGORY'`).
   - Inserts or updates matching rules in `CategoryMapping`.
   - Loops through all transactions in the database and updates them to match the new mapping rules.
   - Run command:
     ```bash
     npx tsx scripts/migrate-categories.ts
     ```

## Workflow to Add New Categories or Clean Up

1. **Run Analysis**: Run the `deep-analyze.ts` script to see what patterns are currently clustering in `OUTROS`.
2. **Modify Migration Rules**: Open `scripts/migrate-categories.ts`, add the desired new categories to `newLinkedCategories` and new pattern matching rules to the `mappingUpdates` array.
3. **Execute Migration**: Run `scripts/migrate-categories.ts` to apply the updates to the database.
4. **Align App Fallbacks**: Update `defaultMapInv` in `src/app/actions.ts` to include any new main category fallbacks so that new CSV imports parse correctly.

## Gotchas & Lessons Learned

- **Conflicting Specific Mappings**: Check the database for existing specific `CategoryMapping` records pointing to `OUTROS` (e.g. `shopee *mixsenhorita...`, `wellhub joao vitor bar`, `asaas *fotop`). If a specific mapping exists in the database, it takes precedence over new generic rules (e.g., `shopee` or `wellhub`), keeping transactions categorized as `OUTROS`.
- **Overwriting Old Mappings**: When adding generic rules, ensure that all existing specific mappings related to those keywords are either deleted or explicitly added to the `mappingUpdates` array in `scripts/migrate-categories.ts` to map them to the correct category.
