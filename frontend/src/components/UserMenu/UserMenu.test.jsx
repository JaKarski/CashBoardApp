import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";
import api from "../../api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate, // Zwracamy mockowaną funkcję
  };
});

// Mock API
vi.mock("../../api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));


describe("UserMenu Component Tests", () => {
  let navigateMock;
  afterEach(() => {
    cleanup(); // Resetuje DOM i stany komponentu po każdym teście
    vi.clearAllMocks(); // Czyści wszystkie mocki
  });

  it("shows create game button only for superuser", async () => {
    // Mock odpowiedzi API dla superużytkownika
    api.get.mockResolvedValueOnce({ data: { is_superuser: true } });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Kliknij avatar, aby otworzyć menu
    const avatar = screen.getByRole("button");
    fireEvent.click(avatar);

    // Poczekaj na efekt ustawiający `isSuperUser` na true
    await waitFor(() => {
      expect(screen.getByText("Create game")).toBeInTheDocument();
    });

    cleanup(); // Reset DOM przed kolejnym przypadkiem

    // Mock odpowiedzi API dla zwykłego użytkownika
    api.get.mockResolvedValueOnce({ data: { is_superuser: false } });

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Kliknij avatar ponownie
    const newAvatar = screen.getByRole("button");
    fireEvent.click(newAvatar);

    // Sprawdź, czy przycisk "Create game" nie pojawia się
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

    fireEvent.click(screen.getByRole("button")); // Otwórz menu
    fireEvent.click(screen.getByText("Logout")); // Kliknij przycisk Logout

    expect(mockNavigate).toHaveBeenCalledWith("/logout");
  });
  it("navigates to /wip when My profile button is clicked", () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button")); // Otwórz menu
    fireEvent.click(screen.getByText("My profile")); // Kliknij przycisk My profile

    expect(mockNavigate).toHaveBeenCalledWith("/wip");
  });
  it("joins a room and navigates to the game page when Join button is clicked", async () => {
    api.post.mockResolvedValueOnce({ status: 200 }); // Mock poprawnej odpowiedzi API
  
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
  
    fireEvent.click(screen.getByRole("button")); // Otwórz menu
  
    const roomInput = screen.getByPlaceholderText("Room code"); // Znajdź pole po placeholderze
    fireEvent.change(roomInput, { target: { value: "12345" } }); // Wprowadź kod pokoju
  
    fireEvent.click(screen.getByText("Join")); // Kliknij przycisk Join
  
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game/12345");
    });
  });
  
  
});
