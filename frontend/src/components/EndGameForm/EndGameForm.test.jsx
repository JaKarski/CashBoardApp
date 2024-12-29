import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EndGameModal from "./EndGameForm";
import { BrowserRouter as Router } from "react-router-dom";
import api from "../../api";
import { toast } from "react-toastify";

vi.mock("../../api");
vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const renderWithRouter = (onClose = vi.fn()) => {
    render(
        <Router>
            <EndGameModal onClose={onClose} />
        </Router>
    );
};

describe("EndGameModal Component", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    it("should render players and show total money on the table", async () => {
        api.get.mockResolvedValueOnce({
            data: {
                players: [
                    { name: "Player1", stack: 1000, payout: 0 },
                    { name: "Player2", stack: 2000, payout: 0 },
                ],
            },
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText("Money on table: 3000 PLN")).toBeInTheDocument();
        });

        expect(screen.getByText(/Player1 buyin for: 1000 cashout/i)).toBeInTheDocument();
        expect(screen.getByText(/Player2 buyin for: 2000 cashout/i)).toBeInTheDocument();
    });
    it("should update total money on the table when payouts are changed", async () => {
        api.get.mockResolvedValueOnce({
            data: {
                players: [
                    { name: "Player1", stack: 1000, payout: 0 },
                    { name: "Player2", stack: 2000, payout: 0 },
                ],
            },
        });

        renderWithRouter();

        await waitFor(() => {
            expect(screen.getByText("Money on table: 3000 PLN")).toBeInTheDocument();
        });

        const inputPlayer1 = screen.getAllByRole("spinbutton")[0];
        fireEvent.change(inputPlayer1, { target: { value: "500" } });

        const inputPlayer2 = screen.getAllByRole("spinbutton")[1];
        fireEvent.change(inputPlayer2, { target: { value: "2500" } });

        await waitFor(() => {
            expect(screen.getByText("Money on table: 0 PLN")).toBeInTheDocument();
        });
    });
    it("should handle successful game end and show success toast", async () => {
        api.get.mockResolvedValueOnce({
            data: {
                players: [
                    { name: "Player1", stack: 1000, payout: 0 },
                    { name: "Player2", stack: 2000, payout: 0 },
                ],
            },
        });

        api.post.mockResolvedValueOnce({ status: 200 });

        const onClose = vi.fn();
        renderWithRouter(onClose);

        await waitFor(() => {
            expect(screen.getByText("Money on table: 3000 PLN")).toBeInTheDocument();
        });

        fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "1000" } });
        fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "2000" } });

        fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Game ended successfully!", { toastId: "game_end_success" });
            expect(onClose).toHaveBeenCalled();
        });
    });
    it("should enable and disable the Confirm button based on remaining money on the table", async () => {
        // Symulacja odpowiedzi API na pobranie graczy
        api.get.mockResolvedValueOnce({
            data: {
                players: [
                    { name: "Player1", stack: 1000, payout: 0 },
                    { name: "Player2", stack: 2000, payout: 0 },
                ],
            },
        });
    
        renderWithRouter();
    
        // Oczekiwanie na załadowanie graczy
        await waitFor(() => {
            expect(screen.getByText("Money on table: 3000 PLN")).toBeInTheDocument();
        });
    
        // Sprawdzenie, czy przycisk Confirm jest zablokowany
        const confirmButton = screen.getByRole("button", { name: /confirm/i });
        expect(confirmButton).toBeDisabled();
    
        // Symulacja zmiany wartości cash_out, które powodują, że pieniądze na stole nie wynoszą 0
        fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "500" } });
        fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "2000" } });
    
        // Sprawdzenie, czy przycisk Confirm nadal jest zablokowany
        await waitFor(() => {
            expect(confirmButton).toBeDisabled();
        });
    
        // Symulacja ustawienia wartości cash_out tak, aby pieniądze na stole wynosiły 0
        fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "1000" } });
        fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "2000" } });
    
        // Sprawdzenie, czy przycisk Confirm został odblokowany
        await waitFor(() => {
            expect(confirmButton).toBeEnabled();
        });
    });
});
