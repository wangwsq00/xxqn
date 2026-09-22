import { describe, expect, it } from "vitest";
import { WOODEN_SWORD_ATK, STARTER_SWORD_INSTANCE_ID } from "../equip/catalog";
import { equipItem } from "../equip/state";
import { QIXING_JIANZHEN_ID } from "../gongfa/catalog";
import { equipGongfa } from "../gongfa/state";
import { defaultSave } from "../save/storage";
import { heroAttributeLines } from "./heroSheet";

describe("detailed attribute sheet", () => {
  it("lists only combat stats already derived for the hero", () => {
    const save = defaultSave(1);
    const lines = heroAttributeLines(save);
    expect(lines.map((line) => line.label)).toEqual([
      "生命",
      "攻击",
      "防御",
      "速度",
      "命中",
      "闪避",
      "暴击",
      "抗暴击",
      "格挡",
      "抗格挡",
    ]);
    expect(lines.find((line) => line.label === "生命")?.value).toBe("300");
    expect(lines.find((line) => line.label === "攻击")?.value).toBe("100");
    expect(lines.find((line) => line.label === "防御")?.value).toBe("80");
    expect(lines.find((line) => line.label === "速度")?.value).toBe("50");
    expect(lines.find((line) => line.label === "命中")?.value).toBe("85");
  });

  it("matches equipped weapon and gongfa bonuses", () => {
    const save = defaultSave(1);
    const armed = {
      ...save,
      equipment: equipItem(save.equipment, STARTER_SWORD_INSTANCE_ID),
      gongfa: equipGongfa(save.gongfa, QIXING_JIANZHEN_ID),
    };
    const lines = heroAttributeLines(armed);
    expect(lines.find((line) => line.label === "攻击")?.value).toBe(String(100 + WOODEN_SWORD_ATK + 50));
    expect(lines.find((line) => line.label === "暴击")?.value).toBe("20");
  });
});
