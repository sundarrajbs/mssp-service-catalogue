import { describe, expect, it } from "vitest";

import { createSeedCatalogue } from "@/lib/seed/catalogue";
import { CatalogueValidationError } from "./CatalogueRepository";
import { LocalStorageCatalogueRepository } from "./localStorageRepository";
import { SupabaseCatalogueRepository } from "./supabaseRepository";

type Row = { id: string; name: string; data: unknown; updated_at: string };

/** Just enough of the Supabase query builder for these tests, backed by an array. */
function fakeSupabase(rows: Row[] = []) {
  const calls: string[] = [];
  const from = () => {
    let op: "select" | "update" | "insert" | "delete" = "select";
    let payload: Partial<Row> = {};
    let filterId: string | undefined;
    let single: "one" | "maybe" | undefined;
    const pick = (r: Row) => ({ id: r.id, name: r.name, updated_at: r.updated_at, data: r.data });
    const run = () => {
      calls.push(op);
      let result: Row[];
      if (op === "insert") {
        const row = { updated_at: "2026-09-26T00:00:00Z", ...payload } as Row;
        rows.push(row);
        result = [row];
      } else {
        const matched = rows.filter((r) => filterId === undefined || r.id === filterId);
        if (op === "update") matched.forEach((r) => Object.assign(r, payload, { updated_at: "2026-09-27T00:00:00Z" }));
        if (op === "delete") matched.forEach((r) => rows.splice(rows.indexOf(r), 1));
        result = matched;
      }
      const data = result.map(pick);
      if (single === "one") return { data: data[0] ?? null, error: data[0] ? null : { message: "no rows" } };
      if (single === "maybe") return { data: data[0] ?? null, error: null };
      return { data, error: null };
    };
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (_: string, value: string) => ((filterId = value), builder),
      update: (p: Partial<Row>) => ((op = "update"), (payload = p), builder),
      insert: (p: Partial<Row>) => ((op = "insert"), (payload = p), builder),
      delete: () => ((op = "delete"), builder),
      single: () => ((single = "one"), builder),
      maybeSingle: () => ((single = "maybe"), builder),
      then: (resolve: (v: unknown) => void) => resolve(run()),
    };
    return builder;
  };
  return { client: { from } as never, rows, calls };
}

describe("SupabaseCatalogueRepository", () => {
  it("creates a catalogue named after the MSSP, then updates it", async () => {
    const { client, rows, calls } = fakeSupabase();
    const repo = new SupabaseCatalogueRepository(client);
    const catalogue = { ...createSeedCatalogue(), mspName: "Acme Secure" };

    const created = await repo.save(catalogue);
    expect(created).toMatchObject({ id: catalogue.id, name: "Acme Secure" });
    expect(calls).toEqual(["update", "insert"]);
    expect(rows[0]).not.toHaveProperty("owner_id"); // set by the database, never by the app

    await repo.save({ ...catalogue, mspName: "Renamed MSSP" });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Acme Secure"); // switcher name only changes when asked
  });

  it("validates before every save and writes nothing when invalid", async () => {
    const { client, calls } = fakeSupabase();
    const repo = new SupabaseCatalogueRepository(client);
    const bad = { ...createSeedCatalogue(), brandColour: "red" };
    await expect(repo.save(bad)).rejects.toBeInstanceOf(CatalogueValidationError);
    const dangling = createSeedCatalogue();
    dangling.tiers[0].services.push({ serviceId: "missing", inclusion: "included" });
    await expect(repo.save(dangling)).rejects.toThrow(/missing/);
    expect(calls).toEqual([]);
  });

  it("cleans text before saving", async () => {
    const { client, rows } = fakeSupabase();
    const catalogue = { ...createSeedCatalogue(), mspName: "Acme​" };
    await new SupabaseCatalogueRepository(client).save(catalogue, "Q3\u0000 proposal");
    expect(rows[0].name).toBe("Q3 proposal");
    expect((rows[0].data as { mspName: string }).mspName).toBe("Acme");
  });

  it("loads, validates and maps rows", async () => {
    const catalogue = createSeedCatalogue();
    const { client } = fakeSupabase([{ id: catalogue.id, name: "Mine", data: catalogue, updated_at: "2026-09-26T00:00:00Z" }]);
    const repo = new SupabaseCatalogueRepository(client);
    expect(await repo.list()).toEqual([{ id: catalogue.id, name: "Mine", updatedAt: "2026-09-26T00:00:00Z" }]);
    expect((await repo.load(catalogue.id))?.catalogue).toEqual(catalogue);
    expect(await repo.load("other")).toBeNull();
  });

  it("refuses to load stored data that fails validation", async () => {
    const { client } = fakeSupabase([{ id: "x", name: "Broken", data: { hello: "world" }, updated_at: "t" }]);
    await expect(new SupabaseCatalogueRepository(client).load("x")).rejects.toBeInstanceOf(CatalogueValidationError);
  });

  it("renames and deletes", async () => {
    const catalogue = createSeedCatalogue();
    const { client, rows } = fakeSupabase([{ id: catalogue.id, name: "Old", data: catalogue, updated_at: "t" }]);
    const repo = new SupabaseCatalogueRepository(client);
    expect((await repo.rename(catalogue.id, "  New   name ")).name).toBe("New name");
    await expect(repo.rename(catalogue.id, "   ")).rejects.toBeInstanceOf(CatalogueValidationError);
    await repo.remove(catalogue.id);
    expect(rows).toEqual([]);
  });
});

describe("LocalStorageCatalogueRepository", () => {
  function memoryStorage(): Storage {
    const map = new Map<string, string>();
    return {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
      clear: () => map.clear(),
      key: (i) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    };
  }

  it("round-trips a single catalogue and removes it", async () => {
    const storage = memoryStorage();
    const repo = new LocalStorageCatalogueRepository("k", storage);
    const catalogue = createSeedCatalogue();
    expect(await repo.list()).toEqual([]);
    await repo.save(catalogue);
    expect((await repo.list())[0].id).toBe(catalogue.id);
    expect((await repo.load(catalogue.id))?.catalogue).toEqual(catalogue);
    await repo.remove(catalogue.id);
    expect(storage.getItem("k")).toBeNull();
  });

  it("ignores unreadable or invalid data", async () => {
    const storage = memoryStorage();
    storage.setItem("k", "{not json");
    expect(await new LocalStorageCatalogueRepository("k", storage).list()).toEqual([]);
    storage.setItem("k", JSON.stringify({ schemaVersion: 1 }));
    expect(await new LocalStorageCatalogueRepository("k", storage).list()).toEqual([]);
  });
});
