import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import MyStats from "./MyStats";
import api from "../../api";

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes("/api/user/stats/")) {
        return Promise.resolve({
          data: {
            earn: 1200.5,
            games_played: 35,
            total_play_time: 75,
            hourly_rate: 16.01,
            highest_win: 500,
            average_stake: 40,
            win_rate: 0.75,
            total_buyin: 1400,
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    }),
  },
}));

describe("MyStats Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders stats correctly", async () => {
    render(<MyStats />);

    await waitFor(() => {
      expect(screen.getByText("PLN 1200.5")).toBeInTheDocument(); // Earn
      expect(screen.getByText("35")).toBeInTheDocument(); // Games Played
      expect(screen.getByText("75 hours")).toBeInTheDocument(); // Total Play Time
      expect(screen.getByText("PLN 16.01/hour")).toBeInTheDocument(); // Hourly Rate
      expect(screen.getByText("PLN 500")).toBeInTheDocument(); // Highest Win
      expect(screen.getByText("PLN 40")).toBeInTheDocument(); // Average Stake
      expect(screen.getByText("0.75")).toBeInTheDocument(); // Win Rate
      expect(screen.getByText("PLN 1400")).toBeInTheDocument(); // Total Buy-in
    });
  });

  it("handles API errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    api.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<MyStats />);

    await waitFor(() => {
      expect(screen.queryByText("PLN 1200.5")).not.toBeInTheDocument();
      expect(screen.queryByText("35")).not.toBeInTheDocument();
    });

    // Przywrócenie console.error
    consoleErrorSpy.mockRestore();
  });

  it("renders all icons correctly", async () => {
    render(<MyStats />);
  
    await waitFor(() => {
      const svgs = screen.getAllByRole("img", { hidden: true }); 
      expect(svgs.length).toBe(8);
    });
  });
});
