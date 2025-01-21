import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import GameForm from "./GameForm";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

describe("GameForm Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockNavigate = vi.fn();
  useNavigate.mockReturnValue(mockNavigate);

  it("renders the GameForm component", () => {
    render(<GameForm />);

    expect(screen.getByText("Create Game Form")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("updates blind and buy_in sliders", () => {
    render(<GameForm />);

    const blindSlider = screen.getByLabelText(/Big Blind/i);
    fireEvent.change(blindSlider, { target: { value: 1.5 } });
    expect(blindSlider.value).toBe("1.5");

    const buyInSlider = screen.getByLabelText(/Buy In/i);
    fireEvent.change(buyInSlider, { target: { value: 100 } });
    expect(buyInSlider.value).toBe("100");
  });

  it("submits form and shows success toast on success", async () => {
    api.post.mockResolvedValueOnce({
      status: 201,
      data: { code: "GAME1234" },
    });

    render(<GameForm />);

    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("api/games/create/", expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith(
        "Game created successfully! Code: GAME1234"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/game/GAME1234");
    });
  });

  it("shows error toast on API failure", async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 400 },
    });

    render(<GameForm />);

    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("There was a problem creating the game.");
    });
  });

  it("shows network error toast on network failure", async () => {
    api.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<GameForm />);

    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error occurred.");
    });
  });

  it("navigates back when Back button is clicked", () => {
    render(<GameForm />);

    const backButton = screen.getByText(/Back/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
