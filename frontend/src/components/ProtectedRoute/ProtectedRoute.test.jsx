import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";

// Mockowanie localStorage
vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
    if (key === ACCESS_TOKEN) return "valid_access_token";
    if (key === REFRESH_TOKEN) return "refresh_token";
    return null;
});
 
// Mock API
vi.mock("../../api", () => ({
    post: vi.fn((url, data) => {
        if (url === "/api/token/refresh/") {
            if (data.refresh === "refresh_token") {
                return Promise.resolve({
                    status: 200,
                    data: { access: "new_access_token" },
                });
            }
            return Promise.reject({ response: { status: 401 } });
        }
        return Promise.reject(new Error("Invalid API endpoint"));
    }),
}));

// Mock jwtDecode
vi.mock("jwt-decode", () => ({
    jwtDecode: () => {
        return { exp: Date.now() / 1000 + 1000 }; // Token ważny w przyszłości
    },
}));

describe("ProtectedRoute", () => {
    it("renders children when user is authorized", async () => {
        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // Czekaj na pojawienie się zawartości
        const content = await screen.findByText("Protected Content");
        expect(content).toBeInTheDocument();
    });

    it("redirects to /register when user is unauthorized", async () => {
        // Ustaw mock localStorage na brak tokenu
        Storage.prototype.getItem.mockImplementation(() => null);

        render(
            <MemoryRouter initialEntries={["/protected"]}>
                <ProtectedRoute>
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // Sprawdź, że zawartość nie istnieje i następuje przekierowanie
        await waitFor(() => {
            expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
        });
    });

    it("renders children when token has expired but refresh token is valid", async () => {
        // Mockowanie wygasłego tokenu
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === ACCESS_TOKEN) return "expired_access_token";
            if (key === REFRESH_TOKEN) return "refresh_token";
            return null;
        });

        vi.mock("jwt-decode", () => ({
            jwtDecode: () => {
                return { exp: Date.now() / 1000 - 1000 }; // Token wygasł w przeszłości
            },
        }));

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // Czekaj na pojawienie się zawartości
        const content = await screen.findByText("Protected Content");
        expect(content).toBeInTheDocument();
    });
    it("renders children when token is valid", async () => {
        // Mockowanie ważnego tokenu
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === ACCESS_TOKEN) return "valid_access_token";
            if (key === REFRESH_TOKEN) return "refresh_token";
            return null;
        });

        vi.mock("jwt-decode", () => ({
            jwtDecode: () => {
                return { exp: Date.now() / 1000 + 1000 }; // Token ważny w przyszłości
            },
        }));

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        );

        // Czekaj na pojawienie się zawartości
        const content = await screen.findByText("Protected Content");
        expect(content).toBeInTheDocument();
    });
});
