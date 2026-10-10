// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App.js";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/auth/demo-login") || url.includes("/api/auth/me")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            token: "mock-jwt-token",
            user: {
              id: "user_household_1",
              name: "Priya Sharma",
              role: "household",
              zoneId: "zone_delhi_south",
              createdAt: new Date().toISOString(),
            },
          }),
        };
      }
      if (url.includes("/pins")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            pins: [],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    })
  );
});

describe("ScrapSaathi Portal App", () => {
  it("renders portal header with brand title", async () => {
    render(<App />);
    expect(await screen.findAllByText(/Scrap/i)).toBeDefined();
  });
});
