// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./components/Button.js";
import { StatusBadge } from "./components/StatusBadge.js";
import { StarRating } from "./components/StarRating.js";
import { OfflineBanner } from "./components/OfflineBanner.js";

describe("UI Components", () => {
  it("renders Button correctly", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button", { name: /Click Me/i })).toBeDefined();
  });

  it("renders StatusBadge with proper status text", () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText(/Open/i)).toBeDefined();
  });

  it("renders StarRating component", () => {
    const { container } = render(<StarRating value={4} />);
    expect(container).toBeDefined();
  });

  it("renders OfflineBanner without crashing", () => {
    const { container } = render(<OfflineBanner />);
    expect(container).toBeDefined();
  });
});
