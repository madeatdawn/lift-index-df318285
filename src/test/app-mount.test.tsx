import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Mock the Supabase client to avoid network calls during smoke test
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    functions: {
      invoke: () => Promise.resolve({ data: null, error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
  },
}));

describe("app mount smoke test", () => {
  it("App renders without throwing", async () => {
    const { default: App } = await import("../App");
    expect(() => render(<App />)).not.toThrow();
  });
});
