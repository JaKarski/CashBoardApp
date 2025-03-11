import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdditionalInfoSection from "./AdditionalInfoSection";
import api from "../../api";

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes("/api/games/")) {
        return Promise.resolve({
          data: {
            buy_in: 100,
            how_many_plo: 20,
            how_often_stand_up: 1,
            blind: 2,
            is_poker_jackpot: true,
            is_win_27: false,
          },
        });
      } else if (url === "/api/check-superuser/") {
        return Promise.resolve({ data: { is_superuser: true } });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    }),
  },
}));

describe("AdditionalInfoSection Component Tests", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("displays 'End Game' button only for superuser", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<AdditionalInfoSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("End Game")).toBeInTheDocument();
    });
  });
  it("does not display 'End Game' button for non-superuser", async () => {
    vi.mocked(api.get).mockImplementationOnce((url) => {
      if (url === "/api/check-superuser/") {
        return Promise.resolve({ data: { is_superuser: false } });
      }
      return Promise.resolve({
        data: {
          buy_in: 100,
          how_many_plo: 20,
          how_often_stand_up: 1,
          blind: 2,
          is_poker_jackpot: true,
          is_win_27: false,
        },
      });
    });

    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<AdditionalInfoSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText("End Game")).not.toBeInTheDocument();
    });
  });
  it("displays modal when 'End Game' button is clicked", async () => {
    const playersMock = [
        { name: "Player1", stack: 1000, payout: 0 },
        { name: "Player2", stack: 2000, payout: 0 },
    ];

    vi.mocked(api.get).mockImplementation((url) => {
        if (url.includes("/api/games/")) {
            return Promise.resolve({
                data: {
                    buy_in: 100,
                    how_many_plo: 20,
                    how_often_stand_up: 1,
                    blind: 2,
                    is_poker_jackpot: true,
                    is_win_27: false,
                    players: playersMock,
                },
            });
        } else if (url === "/api/check-superuser/") {
            return Promise.resolve({ data: { is_superuser: true } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
        <MemoryRouter initialEntries={["/game/GAME123"]}>
            <Routes>
                <Route path="/game/:code" element={<AdditionalInfoSection />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText("End Game")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("End Game"));

    await waitFor(() => {
        const modal = screen.getByRole("dialog"); 
        expect(modal).toBeVisible();
        expect(modal).toHaveTextContent("Money on table:");
    });
  });
  it("hides modal when 'Cancel' button is clicked", async () => {
    const playersMock = [
        { name: "Player1", stack: 1000, payout: 0 },
        { name: "Player2", stack: 2000, payout: 0 },
    ];

    vi.mocked(api.get).mockImplementation((url) => {
        if (url.includes("/api/games/")) {
            return Promise.resolve({
                data: {
                    buy_in: 100,
                    how_many_plo: 20,
                    how_often_stand_up: 1,
                    blind: 2,
                    is_poker_jackpot: true,
                    is_win_27: false,
                    players: playersMock,
                },
            });
        } else if (url === "/api/check-superuser/") {
            return Promise.resolve({ data: { is_superuser: true } });
        }
        return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
        <MemoryRouter initialEntries={["/game/GAME123"]}>
            <Routes>
                <Route path="/game/:code" element={<AdditionalInfoSection />} />
            </Routes>
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText("End Game")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("End Game"));

    await waitFor(() => {
        const modal = screen.getByRole("dialog");
        expect(modal).toBeVisible();
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });  
});
