import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { vi } from "vitest";
import Game from "./Game";
import api from "../../api";

// Mock API calls
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock navigate hook
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock child components
vi.mock("../../components/PlayerSection/PlayerSection", () => ({
  default: () => <div data-testid="mock-player-section">Player Section</div>,
}));

vi.mock("../../components/GameSection/GameSection", () => ({
  default: () => <div data-testid="mock-game-section">Game Section</div>,
}));

vi.mock("../../components/AdditionalInfoSection/AdditionalInfoSection", () => ({
  default: () => <div data-testid="mock-additional-info-section">Additional Info Section</div>,
}));

// Mock play method for HTMLMediaElement
beforeAll(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
});

describe("Game Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and fetches player status successfully", async () => {
    api.get.mockResolvedValueOnce({
      status: 200,
      data: { is_in_game: true, is_game_ended: false },
    });

    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    // Check if mocked child components are rendered
    expect(screen.getByTestId("mock-player-section")).toBeInTheDocument();
    expect(screen.getByTestId("mock-game-section")).toBeInTheDocument();
    expect(screen.getByTestId("mock-additional-info-section")).toBeInTheDocument();
  });

  it("redirects and warns if the user is not in the game", async () => {
    api.get.mockResolvedValueOnce({
      status: 200,
      data: { is_in_game: false, is_game_ended: false },
    });

    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // Check if the toast notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/You are not assigned to this game/i)).toBeInTheDocument();
    });
  });

  it("redirects and informs if the game has ended", async () => {
    api.get.mockRejectedValueOnce({
      response: {
        status: 410,
      },
    });

    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // Check if the toast notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/This game has ended./i)).toBeInTheDocument();
    });
  });
  it("shows an error if the game is not found", async () => {
    api.get.mockRejectedValueOnce({
      response: {
        status: 404,
      },
    });
  
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  
    // Check if the toast notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/Game not found./i)).toBeInTheDocument();
    });
  });
  it("shows an error for unexpected server issues", async () => {
    api.get.mockRejectedValueOnce({
      response: {
        status: 500,
      },
    });
  
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled(); // No redirect expected
    });
  
    // Check if the toast notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred./i)).toBeInTheDocument();
    });
  });
  it("allows user to continue if they are in the game", async () => {
    api.get.mockResolvedValueOnce({
      status: 200,
      data: { is_in_game: true, is_game_ended: false },
    });
  
    render(
      <MemoryRouter initialEntries={["/game/GAME123"]}>
        <Routes>
          <Route path="/game/:code" element={<Game />} />
        </Routes>
        <ToastContainer />
      </MemoryRouter>
    );
  
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled(); // No redirect
    });
  
    // Check if the components render correctly
    expect(screen.getByTestId("mock-player-section")).toBeInTheDocument();
    expect(screen.getByTestId("mock-game-section")).toBeInTheDocument();
    expect(screen.getByTestId("mock-additional-info-section")).toBeInTheDocument();
  });
}); 