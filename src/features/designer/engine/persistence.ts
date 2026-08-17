import type { SavedDesign } from "@/generated/prisma/client";
import { DesignStateSchema, type DesignState } from "./types";

/**
 * `SavedDesign.state` is a Postgres `Json` column, so Prisma hands back a
 * plain object. It is still validated on read: rows can predate a schema
 * change, or be hand-edited, and the designer should not crash on one bad row.
 */

export type SavedDesignDTO = Omit<SavedDesign, "state"> & {
  state: DesignState | null;
};

export function toSavedDesignDTO(row: SavedDesign): SavedDesignDTO {
  const parsed = DesignStateSchema.safeParse(row.state);
  return { ...row, state: parsed.success ? parsed.data : null };
}
