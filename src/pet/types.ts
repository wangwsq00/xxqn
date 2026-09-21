/** M1 仅一只出战灵宠；后续可扩展 owned 列表。 */
export interface SavePet {
  /** 已拥有的灵宠定义 id。 */
  owned: string[];
  /** 当前出战的灵宠；null 表示未装备。 */
  equippedId: string | null;
}
