import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatUrssafRateLabel,
  summarizeProviderTransactions,
} from "../src/lib/billing/provider-monthly-urssaf.js";

describe("summarizeProviderTransactions", () => {
  it("agrège CA, commission, cotisations et net sur plusieurs cours", () => {
    const synthesis = summarizeProviderTransactions(
      [
        {
          amount_gross: 40,
          commission_sasu: 3,
          taxes_urssaf: 7.81,
          net_payout: 29.19,
          teacher_gross_revenue: 37,
        },
        {
          amount_gross: 45,
          commission_sasu: 3,
          taxes_urssaf: 8.87,
          net_payout: 33.13,
          teacher_gross_revenue: 42,
        },
      ],
      {
        statusAcre: false,
        versementLiberatoire: false,
        urssafPeriodicity: "monthly",
      },
      2,
    );

    assert.equal(synthesis.courseCount, 2);
    assert.equal(synthesis.totalInvoicedHt, 79);
    assert.equal(synthesis.totalPaidParentTtc, 85);
    assert.equal(synthesis.totalCommission, 6);
    assert.equal(synthesis.totalBaseAfterCommission, 79);
    assert.equal(synthesis.totalUrssafCotisations, 16.68);
    assert.equal(synthesis.totalNetPayout, 62.32);
    assert.equal(synthesis.fiscalProfileLabel, "Standard (taux plein)");
    assert.equal(synthesis.urssafPeriodicityLabel, "Mensuelle");
    assert.equal(
      synthesis.cotisationsLabel,
      "Cotisations URSSAF estimées",
    );
  });

  it("adapte le libellé des cotisations avec versement libératoire", () => {
    const synthesis = summarizeProviderTransactions(
      [
        {
          amount_gross: 40,
          commission_sasu: 3,
          taxes_urssaf: 8.62,
          net_payout: 28.38,
        },
      ],
      {
        statusAcre: false,
        versementLiberatoire: true,
        urssafPeriodicity: "quarterly",
      },
      1,
    );

    assert.equal(
      synthesis.cotisationsLabel,
      "Cotisations estimées (URSSAF + versement libératoire)",
    );
    assert.equal(synthesis.urssafPeriodicityLabel, "Trimestrielle");
  });
});

describe("formatUrssafRateLabel", () => {
  it("affiche ACRE et libératoire quand les deux s'appliquent", () => {
    const label = formatUrssafRateLabel({
      statusAcre: true,
      versementLiberatoire: true,
    });
    assert.match(label, /10\.6 % URSSAF/);
    assert.match(label, /2\.2 % versement libératoire/);
  });
});
