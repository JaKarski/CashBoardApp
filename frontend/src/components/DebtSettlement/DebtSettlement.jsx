import React, { useEffect, useState } from 'react';
import "./DebtSettlement.css";
import api from '../../api';  // Zakładam, że masz gotowy moduł API do komunikacji z backendem

const DebtSettlement = () => {
  const [debtData, setDebtData] = useState([]);

  // Funkcja pobierania danych o długach z backendu
  const fetchDebts = async () => {
    try {
      const response = await api.get('/api/debts/');  // Wywołanie backendu
      console.log(response.data)
      setDebtData(response.data);  // Ustawienie danych o długach
    } catch (error) {
      console.error("Błąd podczas pobierania danych o długach:", error);
    }
  };

  // Wywołaj fetchDebts, kiedy komponent zostanie zamontowany
  useEffect(() => {
    fetchDebts();
  }, []);

  // Funkcja do wysyłania pieniędzy
  const handleSend = async (debtId) => {
    try {
      await api.post(`/api/debts/send/${debtId}/`);
      alert('Debt sent successfully!');
      // Po aktualizacji odśwież dane
      fetchDebts();
    } catch (error) {
      console.error("Błąd podczas wysyłania długu:", error);
    }
  };

  // Funkcja do akceptowania pieniędzy
  const handleAccept = async (debtId) => {
    try {
      await api.post(`/api/debts/accept/${debtId}/`);
      alert('Debt accepted successfully!');
      // Po aktualizacji odśwież dane
      fetchDebts();
    } catch (error) {
      console.error("Błąd podczas akceptowania długu:", error);
    }
  };

  return (
    <div className="debt-section">
      <h2>Debt settlement</h2>
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
              <button
                className="debt-button"
                onClick={() => (debt.type === "incoming" ? handleAccept(debt.id) : handleSend(debt.id))}
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
