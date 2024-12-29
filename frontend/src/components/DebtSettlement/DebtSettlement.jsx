import React, { useEffect, useState } from 'react';
import "./DebtSettlement.css";
import api from '../../api'; // Assuming you have a module for API communication
import { toast } from "react-toastify"; // Import toast for notifications
import "react-toastify/dist/ReactToastify.css"; // Import default styles


const DebtSettlement = () => {
  const [debtData, setDebtData] = useState([]);

  // Function to fetch debt data from the backend
  const fetchDebts = async () => {
    try {
      const response = await api.get('/api/debts/'); // API call to fetch debt data
      setDebtData(response.data); // Setting fetched data into state
    } catch (error) {
      toast.error("Error while fetching debts. Please try again.", {
        toastId: "fetch_debts_error",
      });
    }
  };

  // Fetch debts when the component is mounted
  useEffect(() => {
    fetchDebts();
  }, []);

  // Function to send money for a debt
  const handleSend = async (debtId) => {
    try {
      await api.post(`/api/debts/send/${debtId}/`); // API call to send money
      toast.success("Debt sent successfully!", {
        toastId: "send_success",
      });
      fetchDebts(); // Refresh data after update
    } catch (error) {
      toast.error("Error while sending debt. Please try again.", {
        toastId: "send_error",
      });
    }
  };

  // Function to accept money for a debt
  const handleAccept = async (debtId) => {
    try {
      await api.post(`/api/debts/accept/${debtId}/`); // API call to accept debt
      toast.success("Debt accepted successfully!", {
        toastId: "accept_success",
      });
      fetchDebts(); // Refresh data after update
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
        {/* Loop through debt data to display each debt item */}
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
