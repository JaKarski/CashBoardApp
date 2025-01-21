import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";
import api from "../../api";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("UserMenu Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows create game button only for superuser", async () => {
    api.get.mockResolvedValueOnce({ data: { is_superuser: true } });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button");
    fireEvent.click(avatar);

    await waitFor(() => {
      expect(screen.getByText("Create game")).toBeInTheDocument();
    });

    cleanup();

    api.get.mockResolvedValueOnce({ data: { is_superuser: false } });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const newAvatar = screen.getByRole("button");
    fireEvent.click(newAvatar);

    await waitFor(() => {
      expect(screen.queryByText("Create game")).not.toBeInTheDocument();
    });
  });

  it("renders UserMenu and toggles dropdown menu", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button");
    expect(avatar).toBeInTheDocument();

    fireEvent.click(avatar);
    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  it("closes dropdown menu when clicking outside", () => {
    render(
      <MemoryRouter>
        <div>
          <UserMenu />
          <div data-testid="outside-element">Outside</div>
        </div>
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button");
    fireEvent.click(avatar);

    expect(screen.getByText("Join")).toBeInTheDocument();

    const outsideElement = screen.getByTestId("outside-element");
    fireEvent.mouseDown(outsideElement);

    expect(screen.queryByText("Join")).not.toBeInTheDocument();
  });

  it("navigates to /logout when Logout button is clicked", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Logout"));

    expect(mockNavigate).toHaveBeenCalledWith("/logout");
  });

  it("handles API error when joining a room", async () => {
  api.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: "Invalid room code." } } });

  render(
    <MemoryRouter>
      <UserMenu />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button"));

  const roomInput = screen.getByPlaceholderText("Room code");
  fireEvent.change(roomInput, { target: { value: "invalid_code" } });

  fireEvent.click(screen.getByText("Join"));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "Invalid room code.",
      expect.objectContaining({
        toastId: "network_problem",
      })
    );
    
  });
});

  it("does nothing when room code is empty", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));

    fireEvent.click(screen.getByText("Join"));

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("toggles dropdown menu on avatar click", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button");
    fireEvent.click(avatar);
    expect(screen.getByText("Join")).toBeInTheDocument();

    fireEvent.click(avatar);
    expect(screen.queryByText("Join")).not.toBeInTheDocument();
  });

  it("navigates to /createGame when Create game button is clicked", async () => {
    api.get.mockResolvedValueOnce({ data: { is_superuser: true } });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const avatar = screen.getByRole("button");
    fireEvent.click(avatar);

    await waitFor(() => {
      const createGameButton = screen.getByText("Create game");
      fireEvent.click(createGameButton);
      expect(mockNavigate).toHaveBeenCalledWith("/createGame");
    });
  });

  it("joins a room and navigates to the game page when Join button is clicked", async () => {
    api.post.mockResolvedValueOnce({ status: 200 });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button"));

    const roomInput = screen.getByPlaceholderText("Room code");
    fireEvent.change(roomInput, { target: { value: "12345" } });

    fireEvent.click(screen.getByText("Join"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game/12345");
    });
  });
});
