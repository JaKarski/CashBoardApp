import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Form from "./Form";
import { BrowserRouter as Router } from "react-router-dom"; // For routing context
import api from "../../api";
import { toast } from "react-toastify";

// Mock API calls
vi.mock("../../api");
vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock localStorage for test environment
Object.defineProperty(window, "localStorage", {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
    },
    writable: true,
});

// Utility function to wrap Form with Router for navigation
const renderWithRouter = (method = "login") => {
    render(
        <Router>
            <Form method={method} route="/test-route" />
        </Router>
    );
};

describe("Form Component", () => {
    afterEach(() => {
        vi.clearAllMocks(); // Use vi.clearAllMocks() for Vitest
    });

    it("should render login form by default", () => {
        renderWithRouter("login");

        // Check if login form fields are rendered
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument(); // Use getByRole for button
    });

    it("should render register form with additional fields", () => {
        renderWithRouter("register");

        // Check if register form fields are rendered
        expect(screen.getByLabelText("Username")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument(); // Use getByRole for button
    });

    it("should call handleSubmit and show success toast for login", async () => {
        // Mock API response
        api.post.mockResolvedValueOnce({
            data: { access: "access_token", refresh: "refresh_token" },
        });
    
        renderWithRouter("login");
    
        // Symulacja wprowadzenia danych użytkownika
        fireEvent.change(screen.getByLabelText("Username"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
    
        // Kliknięcie przycisku "Login"
        fireEvent.click(screen.getByRole("button", { name: /login/i }));
    
        // Oczekiwanie na zakończenie operacji
        await waitFor(() => {
            // Asercja: toast sukcesu
            expect(toast.success).toHaveBeenCalledWith("Logged in successfully!");
    
            // Asercja: zapisy do localStorage
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                "access", // Klucz `access` z constants
                "access_token"
            );
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
                "refresh", // Klucz `refresh` z constants
                "refresh_token"
            );
        });
    });
    

    it("should call handleSubmit and show success toast for registration", async () => {
        api.post.mockResolvedValueOnce({
            data: { access: "access_token", refresh: "refresh_token" },
        });

        renderWithRouter("register");

        fireEvent.change(screen.getByLabelText("Username"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { value: "testuser@example.com" },
        });
        fireEvent.change(screen.getByLabelText("Phone Number"), {
            target: { value: "123456789" },
        });
        fireEvent.change(screen.getByLabelText("First Name"), {
            target: { value: "John" },
        });
        fireEvent.change(screen.getByLabelText("Last Name"), {
            target: { value: "Doe" },
        });

        fireEvent.click(screen.getByRole("button", { name: /register/i }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Registration successful! Please log in.");
        });
    });

    it("should handle API errors and show error toast", async () => {
        api.post.mockRejectedValueOnce({
            response: {
                data: {
                    username: ["Username is required."],
                    password: ["Password is too short."],
                },
            },
        });

        renderWithRouter("register");

        fireEvent.change(screen.getByLabelText("Username"), {
            target: { value: "" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /register/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("username: Username is required.");
            expect(toast.error).toHaveBeenCalledWith("password: Password is too short.");
        });
    });
});
