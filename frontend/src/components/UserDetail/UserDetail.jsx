import React, { useState } from "react";
import "./UserDetail.css";

const UserDetail = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan.kowalski@example.com",
    phone: "+48 123 456 789",
    nickname: "Janek123",
  });

  const [tempData, setTempData] = useState({ ...formData }); // Tymczasowe dane do edycji

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({ ...tempData, [name]: value });
  };

  const handleEditClick = () => {
    setTempData({ ...formData }); // Skopiuj aktualne dane do tymczasowego stanu
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false); // Powrót do widoku bez zmian
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData({ ...tempData }); // Zapisz zmienione dane
    setIsEditing(false);
  };

  return (
    <div className="user-detail-container">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <h2 className="user-detail-title">Edytuj Profil</h2>
          <div className="form-group">
            <label>Imię:</label>
            <input
              type="text"
              name="firstName"
              value={tempData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Nazwisko:</label>
            <input
              type="text"
              name="lastName"
              value={tempData.lastName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={tempData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Numer telefonu:</label>
            <input
              type="text"
              name="phone"
              value={tempData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Nick:</label>
            <input
              type="text"
              name="nickname"
              value={tempData.nickname}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="edit-button">Zatwierdź</button>
            <button type="button" className="edit-button" onClick={handleCancelClick}>Anuluj</button>
          </div>
        </form>
      ) : (
        <>
          <div className="user-detail-content">
            <div className="detail-row">
              <span className="detail-label">Imię:</span>
              <span>{formData.firstName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Nazwisko:</span>
              <span>{formData.lastName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span>{formData.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Numer telefonu:</span>
              <span>{formData.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Nick:</span>
              <span>{formData.nickname}</span>
            </div>
          </div>
          <button className="edit-button" onClick={handleEditClick}>Edytuj dane</button>
        </>
      )}
    </div>
  );
};

export default UserDetail;
