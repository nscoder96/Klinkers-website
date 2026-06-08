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

  it("kiest materiaalvoorkeur uit genoemde materialen", () => {
    const a = toPipelineActivity(
      activity({ materials_mentioned: ["klinkers waalformaat", "antraciet"] })
    );
    expect(a.materialPreference).toBe("klinkers waalformaat antraciet");
  });

  it("valt terug op de omschrijving als geen materialen genoemd zijn", () => {
    const a = toPipelineActivity(activity({ description: "Betonstraatstenen pad" }));
    expect(a.materialPreference).toBe("Betonstraatstenen pad");
  });
});
