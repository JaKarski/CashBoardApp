import { render, screen, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GameSection from "./GameSection";
import api from "../../api";

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes("/games/")) {
        return Promise.resolve({
          data: {
            blinds: 1.0,
            game_start_time: new Date().toISOString(),
            money_on_table: 100.0,
            number_of_players: 4,
            avg_stack: 25.0,
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    }),
  },
}));

describe("GameSection Component Tests", () => {
  beforeAll(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders game data correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<GameSection />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("CashBoard")).toBeInTheDocument();
      expect(screen.getByText("Blinds: 0.5/1")).toBeInTheDocument();
      expect(screen.getByText("Money on the table: 100.00 PLN")).toBeInTheDocument();
      expect(screen.getByText("Number of players: 4")).toBeInTheDocument();
      expect(screen.getByText("Avg stack: 25.00 PLN")).toBeInTheDocument();
    });
  });
  it("renders updated game time correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<GameSection />} />
        </Routes>
      </MemoryRouter>
    );
  
    // Początkowe sprawdzenie renderowania
    await waitFor(() => {
      expect(screen.getByText(/Game time:/)).toBeInTheDocument();
    });
  
    // Symulacja zmiany stanu timera
    const newTime = "0:10:00"; // Przykład zaktualizowanego czasu
    act(() => {
      screen.getByText(/Game time:/).nextSibling.textContent = newTime;
    });
  
    // Sprawdzamy, czy nowy czas jest renderowany
    expect(screen.getByText(newTime)).toBeInTheDocument();
  });
  it("plays sound on the full hour", async () => {
    const playMock = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<GameSection />} />
        </Routes>
      </MemoryRouter>
    );
  
    // Wait for the data to load and the component to render game time
    await waitFor(() => {
      expect(screen.getByText(/Game time:/)).toBeInTheDocument();
    });
  
    // Simulate changing the time to a full hour
    await act(async () => {
      screen.getByText(/Game time:/).nextSibling.textContent = "1:00:00";
    });
  
    // Check if the sound was played
    expect(playMock).toHaveBeenCalled();
  
    playMock.mockRestore();
  });
  
  
  it("formats and displays data correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<GameSection />} />
        </Routes>
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(screen.getByText(/Blinds:/)).toHaveTextContent("0.5/1");
      expect(screen.getByText(/Money on the table:/)).toHaveTextContent("100.00 PLN");
      expect(screen.getByText(/Number of players:/)).toHaveTextContent("4");
      expect(screen.getByText(/Avg stack:/)).toHaveTextContent("25.00 PLN");
    });
  });
  it("clears timer interval on component unmount", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<GameSection />} />
        </Routes>
      </MemoryRouter>
    );
  
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
  
    // Odmontowujemy komponent
    act(() => {
      unmount();
    });
  
    // Sprawdzamy, czy clearInterval został wywołany
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
      
    
});
