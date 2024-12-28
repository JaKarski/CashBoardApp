import { render, screen, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SuperUserRoute from "./SuperUserRoute";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { toast } from "react-toastify";

// Mock API
vi.mock("../../api", () => {
    return {
        default: {
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
            get: vi.fn((url) => {
                if (url === "/api/check-superuser/") {
                    return Promise.resolve({ data: { is_superuser: true } });
                }
                return Promise.reject({ response: { status: 403 } });
            }),
        },
    };
});

// Mock jwtDecode
vi.mock("jwt-decode", () => ({
    jwtDecode: () => {
        return { exp: Date.now() / 1000 + 1000 }; // Token ważny w przyszłości
    },
}));

// Mock toast
vi.spyOn(toast, "error").mockImplementation(() => {});

describe("SuperUserRoute Additional Tests", () => {
    it("shows loading screen while authorization status is being determined", async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <SuperUserRoute>
                        <div>SuperUser Content</div>
                    </SuperUserRoute>
                </MemoryRouter>
            );
        });

        // "Loading..." should be present initially
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
    it("redirects to / when refresh token is invalid", async () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
            if (key === ACCESS_TOKEN) return "expired_access_token";
            if (key === REFRESH_TOKEN) return "invalid_refresh_token";
            return null;
        });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/superuser"]}>
                    <SuperUserRoute>
                        <div>SuperUser Content</div>
                    </SuperUserRoute>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.queryByText("SuperUser Content")).not.toBeInTheDocument();
        });
    });
    it("redirects to / and shows toast error if user is not a superuser", async () => {
        vi.mock("../../api", () => {
            return {
                default: {
                    post: vi.fn((url, data) => {
                        if (url === "/api/token/refresh/") {
                            return Promise.resolve({
                                status: 200,
                                data: { access: "new_access_token" },
                            });
                        }
                        return Promise.reject({ response: { status: 401 } });
                    }),
                    get: vi.fn((url) => {
                        if (url === "/api/check-superuser/") {
                            return Promise.resolve({ data: { is_superuser: false } });
                        }
                        return Promise.reject({ response: { status: 403 } });
                    }),
                },
            };
        });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/superuser"]}>
                    <SuperUserRoute>
                        <div>SuperUser Content</div>
                    </SuperUserRoute>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.queryByText("SuperUser Content")).not.toBeInTheDocument();
        });
        expect(toast.error).toHaveBeenCalledWith("Nie masz dostępu do tej strony!");
    });
    it("renders children when access token is valid and user is a superuser", async () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
            if (key === ACCESS_TOKEN) return "valid_access_token";
            if (key === REFRESH_TOKEN) return "refresh_token";
            return null;
        });

        async () => {
            render(
                <MemoryRouter>
                    <SuperUserRoute>
                        <div>SuperUser Content</div>
                    </SuperUserRoute>
                </MemoryRouter>
            );
    
            await waitFor(() => {
                expect(screen.getByText("SuperUser Content")).toBeInTheDocument();
            });
        };
    });
});
