import skills from "@/data/skills.json";

export type CatalogKind = "skill" | "personalization";

export type CatalogItem = {
  id: string;
  name: string;
  kind: CatalogKind;
  group: string;
  description: string;
  directive: string;
  source?: string;
  badge?: string;
};

export const catalog = skills as CatalogItem[];
export const itemById = new Map(catalog.map((item) => [item.id, item]));
