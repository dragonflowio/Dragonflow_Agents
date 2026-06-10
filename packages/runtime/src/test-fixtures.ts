import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentRow } from "./types.js";

export type FixtureRow = Partial<AgentRow> & { name: string; id?: string };

export function createFixtureSupabase(rows: FixtureRow[]): SupabaseClient {
  return {
    from(table: string) {
      if (table !== "agents") {
        throw new Error(`Fixture supports only "agents", got "${table}".`);
      }
      let selected = false;
      let filterColumn: "name" | "id" | null = null;
      let filterValue: string | null = null;
      const builder = {
        select(_columns: string) {
          selected = true;
          return builder;
        },
        eq(column: string, value: string) {
          if (column !== "name" && column !== "id") {
            throw new Error(`Fixture only filters by name or id, got "${column}".`);
          }
          filterColumn = column;
          filterValue = value;
          return builder;
        },
        async single() {
          if (!selected) {
            return { data: null, error: { message: "select() not called" } };
          }
          if (!filterColumn) {
            return { data: null, error: { message: "eq() not called" } };
          }
          const match = rows.find((row) => row[filterColumn!] === filterValue);
          if (!match) {
            return {
              data: null,
              error: { message: `No row for ${filterColumn}=${filterValue}` },
            };
          }
          return { data: match, error: null };
        },
      };
      return builder as unknown as ReturnType<SupabaseClient["from"]>;
    },
  } as unknown as SupabaseClient;
}
