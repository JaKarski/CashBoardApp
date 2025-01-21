import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import DebtSettlement from "./DebtSettlement";
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
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("DebtSettlement Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockDebts = [
    {
      id: 1,
      type: "incoming",
      to: "Me",
      from: "Alice",
      money: 100,
      phone_number: null,
      game_date: "01-01-2024",
    },
    {
      id: 2,
      type: "outgoing",
      to: "Bob",
      from: "Me",
      money: 50,
      phone_number: "123-456-789",
      game_date: "02-01-2024",
    },
  ];

  it("fetches and displays debts on mount", async () => {
    api.get.mockResolvedValueOnce({ data: mockDebts });

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(screen.getByText("To: Me")).toBeInTheDocument();
      expect(screen.getByText("To: Bob")).toBeInTheDocument();
    });
  });

  it("handles debt send action", async () => {
    api.get.mockResolvedValueOnce({ data: mockDebts });
    api.post.mockResolvedValueOnce({});

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(screen.getByText("To: Bob")).toBeInTheDocument();
    });

    const sendButton = screen.getByText("Send");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Debt sent successfully!", expect.anything());
      expect(api.post).toHaveBeenCalledWith("/api/debts/send/2/");
    });
  });

  it("handles debt accept action", async () => {
    api.get.mockResolvedValueOnce({ data: mockDebts });
    api.post.mockResolvedValueOnce({});

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(screen.getByText("To: Me")).toBeInTheDocument();
    });

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Debt accepted successfully!", expect.anything());
      expect(api.post).toHaveBeenCalledWith("/api/debts/accept/1/");
    });
  });

  it("shows error toast when fetching debts fails", async () => {
    api.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error while fetching debts. Please try again.", expect.anything());
    });
  });

  it("shows error toast when sending debt fails", async () => {
    api.get.mockResolvedValueOnce({ data: mockDebts });
    api.post.mockRejectedValueOnce(new Error("Send Error"));

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(screen.getByText("To: Bob")).toBeInTheDocument();
    });

    const sendButton = screen.getByText("Send");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error while sending debt. Please try again.", expect.anything());
    });
  });

  it("shows error toast when accepting debt fails", async () => {
    api.get.mockResolvedValueOnce({ data: mockDebts });
    api.post.mockRejectedValueOnce(new Error("Accept Error"));

    render(<DebtSettlement />);

    await waitFor(() => {
      expect(screen.getByText("To: Me")).toBeInTheDocument();
    });

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error while accepting debt. Please try again.", expect.anything());
    });
  });
});
