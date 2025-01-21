import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PlayersSection from "./PlayerSection";
import api from "../../api";

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes("/players/")) {
        return Promise.resolve({
          data: { players: [{ name: "Player1", stack: 100 }, { name: "Player2", stack: 0 }], buy_in: 50 },
        });
      }
      if (url.includes("/check-superuser/")) {
        return Promise.resolve({ data: { is_superuser: true } });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    }),
    post: vi.fn(() => Promise.resolve({ status: 200 })),
  },
}));

describe("PlayersSection Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders players list correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<PlayersSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Player1")).toBeInTheDocument();
      expect(screen.getByText("100 PLN")).toBeInTheDocument();
      expect(screen.getByText("Player2")).toBeInTheDocument();
      expect(screen.getByText("0 PLN")).toBeInTheDocument();
    });
  });

  it("handles rebuy action correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<PlayersSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const rebuyButton = screen.getAllByText("Rebuy")[0];
      fireEvent.click(rebuyButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("api/games/GAME123/action/", {
        action: "rebuy",
        username: "Player1",
      });
    });
  });

  it("handles back action correctly for superuser", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<PlayersSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getAllByText("Back")[0];
      fireEvent.click(backButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("api/games/GAME123/action/", {
        action: "back",
        username: "Player1",
      });
    });
  });

  it("handles API errors gracefully", async () => {
    // Wycisz tymczasowo console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  
    // Symuluj błąd sieciowy
    api.get.mockRejectedValueOnce(new Error("Network Error"));
  
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<PlayersSection />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      // Sprawdź, że lista graczy nie jest wyświetlana
      expect(screen.queryByText("Player1")).not.toBeInTheDocument();
    });
  
    // Przywróć domyślne zachowanie console.error po zakończeniu testu
    consoleErrorSpy.mockRestore();
  });  
});
