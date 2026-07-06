import { describe, it, expect } from "vitest";
import { toPipelineActivity } from "../activity-mapper";
import type { Activity } from "../../schemas/ai-understanding.schema";

function activity(partial: Partial<Activity>): Activity {
  return {
    type: "bestrating",
    action: "nieuw",
    description: "Oprit",
    dimensions: {},
    source_text: "",
    materials_mentioned: [],
    ...partial,
  } as Activity;
}

describe("toPipelineActivity", () => {
  it("gebruikt area direct als die er is", () => {
    const a = toPipelineActivity(activity({ dimensions: { area: 70 } }));
    expect(a.area_m2).toBe(70);
  });

  it("leidt area af uit lengte × breedte", () => {
    const a = toPipelineActivity(activity({ dimensions: { length: 14, width: 5 } }));
    expect(a.area_m2).toBe(70);
  });

  it("neemt Gouda-velden over (afgraafdiepte + zanddikte)", () => {
    const a = toPipelineActivity(
      activity({ dimensions: { area: 70, afgraafdiepte_cm: 20, zanddikte_cm: 10 } })
    );
    expect(a.afgraafdiepte_cm).toBe(20);
    expect(a.zanddikte_cm).toBe(10);
  });

  it("kiest het eerste genoemde materiaal als voorkeur (alleen het hoofdmateriaal)", () => {
    const a = toPipelineActivity(
      activity({ materials_mentioned: ["klinkers waalformaat", "antraciet"] })
    );
    // Alleen het eerste materiaal: kleur/uitvoering ("antraciet") niet meenemen —
    // assembly-componenten (opsluitbanden, voegzand) worden toch al apart uitgevouwen.
    expect(a.materialPreference).toBe("klinkers waalformaat");
  });

  it("negeert assembly-gedekte materialen (voegzand, opsluitbanden)", () => {
    const a = toPipelineActivity(
      activity({ materials_mentioned: ["gebakken klinkers waalformaat", "opsluitbanden", "voegzand"] })
    );
    expect(a.materialPreference).toBe("gebakken klinkers waalformaat");
  });

  it("valt terug op de omschrijving als geen materialen genoemd zijn", () => {
    const a = toPipelineActivity(activity({ description: "Betonstraatstenen pad" }));
    expect(a.materialPreference).toBe("Betonstraatstenen pad");
  });

  it("neemt de AI-urenschatting over (A1)", () => {
    const a = toPipelineActivity(activity({ estimated_hours: 12.5 }));
    expect(a.estimated_hours).toBe(12.5);
  });

  it("laat estimated_hours weg als de AI geen uren schatte", () => {
    const a = toPipelineActivity(activity({}));
    expect(a.estimated_hours).toBeUndefined();
  });
});
