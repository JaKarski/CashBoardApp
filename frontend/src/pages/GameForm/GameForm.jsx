import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './GameForm.css'; 
import api from '../../api'

const GameForm = () => {
  // Ustawienia domyślne
  const [blind, setblind] = useState(0.5); // Big Blind domyślnie 0.5
  const [buy_in, setbuy_in] = useState(50); // Buy In domyślnie 50
  const [ploChecked, setPloChecked] = useState(true); // PLO domyślnie zaznaczone
  const [standUpChecked, setStandUpChecked] = useState(false);
  const [how_many_plo, sethow_many_plo] = useState(3); // Domyślnie 3 ręce
  const [how_often_stand_up, sethow_often_stand_up] = useState(1);
  const [is_poker_jackpot, setis_poker_jackpot] = useState(true); // Domyślnie zaznaczone Poker z Showdown'em
  const [is_win_27, setis_win_27] = useState(true); // Domyślnie zaznaczone Win 27o

  const navigate = useNavigate();

  // Funkcja do zaokrąglania wartości do wielokrotności 0.05
  const roundToStep = (value, step) => {
    return Math.round(value / step) * step;
  };

  // Obsługa scrolla dla suwaków
  const handleWheel = (e, value, setter, min, max, step) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    setter(Math.min(max, Math.max(min, roundToStep(value + delta, step))));
  };

  // Obsługa formularza
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // Dane zaokrąglone przed wysłaniem
    const formData = {
      blind: roundToStep(blind, 0.05), // Zaokrąglamy do 0.05
      buy_in: Math.round(buy_in), // Zaokrąglamy Buy In do pełnej liczby
      how_many_plo: ploChecked ? Math.round(how_many_plo) : 0,
      how_often_stand_up: standUpChecked ? Math.round(how_often_stand_up) : 0,
      is_poker_jackpot,
      is_win_27,
    };
  
    console.log("Form Data:", formData);
  
    try {
      // Wysyłanie danych za pomocą skonfigurowanego api
      const response = await api.post("api/games/create/", formData);  // Używamy już skonfigurowanej instancji api
  
      // Obsługa odpowiedzi serwera
      if (response.status === 201) {
        alert(`Gra utworzona! Kod gry: ${response.data.code}`);
        navigate('/game/'+response.data.code)
      }
    } catch (error) {
      if (error.response) {
        alert("Wystąpił problem podczas tworzenia gry.");
      } else {
        alert("Wystąpił problem z siecią.");
      }
    }
  };

  // Funkcja nawigacji do strony głównej
  const handleBack = () => {
    navigate('/'); // Przekierowanie na stronę główną
  };

  return (
    <div className="custom-form-container">
      <h1>Create Game Form</h1>
      <form onSubmit={handleSubmit}>
        {/* Suwak Big Blind */}
        <div className="custom-form-group">
          <label className="custom-form-label">Big Blind: {roundToStep(blind, 0.05).toFixed(2)}</label>
          <input
            className="custom-form-input"
            type="range"
            min="0.05"
            max="10"
            step="0.05"  // Skok 0.05
            value={blind}
            onChange={(e) => setblind(Number(e.target.value))}
            onWheel={(e) => handleWheel(e, blind, setblind, 0.1, 10, 0.05)}
          />
        </div>

        {/* Suwak Buy In */}
        <div className="custom-form-group">
          <label className="custom-form-label">Buy In: {buy_in}</label>
          <input
            className="custom-form-input"
            type="range"
            min="1"
            max="500"
            step="1"
            value={buy_in}
            onChange={(e) => setbuy_in(Number(e.target.value))}
            onWheel={(e) => handleWheel(e, buy_in, setbuy_in, 1, 500, 1)}
          />
        </div>

        {/* Sekcja Games */}
        <h3>Games</h3>
        <div className="custom-form-group">
          <label>
            <input
              type="checkbox"
              checked={ploChecked}
              onChange={() => setPloChecked(!ploChecked)}
            />
            PLO
          </label>
        </div>

        {ploChecked && (
          <div className="custom-form-group">
            <label className="custom-form-label">How many hands: {how_many_plo}</label>
            <input
              className="custom-form-input"
              type="range"
              min="1"
              max="9"
              step="1"
              value={how_many_plo}
              onChange={(e) => sethow_many_plo(Number(e.target.value))}
              onWheel={(e) => handleWheel(e, how_many_plo, sethow_many_plo, 1, 9, 1)}
            />
          </div>
        )}

        <div className="custom-form-group">
          <label>
            <input
              type="checkbox"
              checked={standUpChecked}
              onChange={() => setStandUpChecked(!standUpChecked)}
            />
            Stand-Up
          </label>
        </div>

        {standUpChecked && (
          <div className="custom-form-group">
            <label className="custom-form-label">How often (h): {how_often_stand_up}</label>
            <input
              className="custom-form-input"
              type="range"
              min="1"
              max="5"
              step="1"
              value={how_often_stand_up}
              onChange={(e) => sethow_often_stand_up(Number(e.target.value))}
              onWheel={(e) => handleWheel(e, how_often_stand_up, sethow_often_stand_up, 1, 5, 1)}
            />
          </div>
        )}

        {/* Sekcja Jackpots */}
        <h3>Jackpots</h3>
        <div className="custom-form-group">
          <label>
            <input
              type="checkbox"
              checked={is_poker_jackpot}
              onChange={() => setis_poker_jackpot(!is_poker_jackpot)}
            />
            Poker z Showdown'em
          </label>
        </div>

        <div className="custom-form-group">
          <label>
            <input
              type="checkbox"
              checked={is_win_27}
              onChange={() => setis_win_27(!is_win_27)}
            />
            Win 27o
          </label>
        </div>

        <button className="custom-form-button" type="submit">
          Submit
        </button>
      </form>

      {/* Przycisk Back */}
      <button className="custom-back-button" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};

export default GameForm;
