import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import api from "../../api";
import { toast } from "react-toastify";

// Mock API
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock internal components with default export
vi.mock("../../components/UserMenu/UserMenu", () => ({
    default: () => <div data-testid="user-menu">Mock UserMenu</div>,
  }));
  vi.mock("../../components/MyStats/MyStats", () => ({
    default: () => <div data-testid="my-stats">Mock MyStats</div>,
  }));
  vi.mock("../../components/DebtSettlement/DebtSettlement", () => ({
    default: () => <div data-testid="debt-settlement">Mock DebtSettlement</div>,
  }));
  vi.mock("../../components/UserPlot/UserPlot", () => ({
    default: () => <div data-testid="user-plot">Mock UserPlot</div>,
  }));
  
// Test Suite
describe("Home Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("fetches and displays the username on success", async () => {
    api.get.mockResolvedValueOnce({ data: { username: "testuser" } });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/user/");
      expect(screen.getByText("Welcome testuser")).toBeInTheDocument();
    });
  });

  it("shows an error toast when API call fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/user/");
      expect(toast.error).toHaveBeenCalledWith("Error fetching user data. Please try again.", {
        toastId: "fetch_user_error",
      });
    });
  });

  it("renders child components correctly", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    expect(screen.getByTestId("my-stats")).toBeInTheDocument();
    expect(screen.getByTestId("debt-settlement")).toBeInTheDocument();
    expect(screen.getByTestId("user-plot")).toBeInTheDocument();
  });
});
