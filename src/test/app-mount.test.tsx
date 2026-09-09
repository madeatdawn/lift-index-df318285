import { beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

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

const fetchQuizData = vi.fn(() => new Promise<null>(() => {}));

vi.mock("@/hooks/useQuizDatabase", () => ({
  useQuizDatabase: () => ({
    fetchQuizData,
    saveQuizData: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe("app mount smoke test", () => {
  beforeEach(() => {
    cleanup();
    fetchQuizData.mockClear();
    window.localStorage.clear();
  });

  it("App renders without throwing", async () => {
    const { default: App } = await import("../App");
    expect(() => render(<App />)).not.toThrow();
  });

  it("starts from bundled data without requesting or waiting for Cloud", async () => {
    const { default: App } = await import("../App");
    render(<App />);

    expect(await screen.findByRole("button", { name: "Start Your Assessment" })).toBeInTheDocument();
    expect(fetchQuizData).not.toHaveBeenCalled();
  });
});
