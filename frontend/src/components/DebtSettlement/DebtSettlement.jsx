import React, { useEffect, useState } from 'react';
import "./DebtSettlement.css";
import api from '../../api';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DebtSettlement = () => {
  const [debtData, setDebtData] = useState([]);

  // Fetch debt data from the backend
  const fetchDebts = async () => {
    try {
      const response = await api.get('/api/debts/');
      setDebtData(response.data);
    } catch (error) {
      toast.error("Error while fetching debts. Please try again.", {
        toastId: "fetch_debts_error",
      });
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Send money for a debt
  const handleSend = async (debtId) => {
    try {
      await api.post(`/api/debts/send/${debtId}/`);
      toast.success("Debt sent successfully!", {
        toastId: "send_success",
      });
      fetchDebts();
    } catch (error) {
      toast.error("Error while sending debt. Please try again.", {
        toastId: "send_error",
      });
    }
  };

  // Accept money for a debt
  const handleAccept = async (debtId) => {
    try {
      await api.post(`/api/debts/accept/${debtId}/`);
      toast.success("Debt accepted successfully!", {
        toastId: "accept_success",
      });
      fetchDebts();
    } catch (error) {
      toast.error("Error while accepting debt. Please try again.", {
        toastId: "accept_error",
      });
    }
  };

  return (
    <div className="debt-section">
      <h2>Debt Settlement</h2>
      <div className="debt-grid">
        {debtData.map((debt, index) => (
          <div className="debt-item" key={index}>
            <h3 className="debt-title">
              {debt.type === "incoming" ? "To: Me" : `To: ${debt.to}`}
            </h3>
            <p className="debt-from">From: {debt.from}</p>
            <p className="debt-amount">Money: PLN {debt.money}</p>
            {debt.type !== "incoming" && (
              <p className="debt-phone">Phone: {debt.phone_number}</p>
            )}
            <p className="debt-amount">Game date: {debt.game_date}</p>
            <button
              className="debt-button"
              onClick={() =>
                debt.type === "incoming"
                  ? handleAccept(debt.id)
                  : handleSend(debt.id)
              }
            >
              {debt.type === "incoming" ? "Accept" : "Send"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebtSettlement;
