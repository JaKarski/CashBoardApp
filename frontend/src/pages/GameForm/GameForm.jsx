import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./GameForm.css";
import api from "../../api";

const GameForm = () => {
  const [blind, setblind] = useState(0.5); 
  const [buy_in, setbuy_in] = useState(50); 
  const [ploChecked, setPloChecked] = useState(true); 
  const [standUpChecked, setStandUpChecked] = useState(false);
  const [how_many_plo, sethow_many_plo] = useState(3); 
  const [how_often_stand_up, sethow_often_stand_up] = useState(1);
  const [is_poker_jackpot, setis_poker_jackpot] = useState(true); 
  const [is_win_27, setis_win_27] = useState(true);

  const navigate = useNavigate();

  const roundToStep = (value, step) => Math.round(value / step) * step;

  const handleWheel = (e, value, setter, min, max, step) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    setter(Math.min(max, Math.max(min, roundToStep(value + delta, step))));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = {
      blind: roundToStep(blind, 0.05),
      buy_in: Math.round(buy_in),
      how_many_plo: ploChecked ? Math.round(how_many_plo) : 0,
      how_often_stand_up: standUpChecked ? Math.round(how_often_stand_up) : 0,
      is_poker_jackpot,
      is_win_27,
    };

    try {
      const response = await api.post("api/games/create/", formData);
      if (response.status === 201) {
        toast.success(`Game created successfully! Code: ${response.data.code}`);
        navigate("/game/" + response.data.code);
      }
    } catch (error) {
      if (error.response) {
        toast.error("There was a problem creating the game.");
      } else {
        toast.error("Network error occurred.");
      }
    }
  };

  const handleBack = () => navigate("/");

  return (
    <div className="custom-form-container">
      <h1>Create Game Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="custom-form-group">
          <label htmlFor="blind-slider" className="custom-form-label">
            Big Blind: {roundToStep(blind, 0.05).toFixed(2)}
          </label>
          <input
            id="blind-slider"
            className="custom-form-input"
            type="range"
            min="0.05"
            max="10"
            step="0.05"
            value={blind}
            onChange={(e) => setblind(Number(e.target.value))}
            onWheel={(e) => handleWheel(e, blind, setblind, 0.05, 10, 0.05)}
          />
        </div>

        <div className="custom-form-group">
          <label htmlFor="buy-in-slider" className="custom-form-label">
            Buy In: {buy_in}
          </label>
          <input
            id="buy-in-slider"
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
            <label className="custom-form-label">
              How many hands: {how_many_plo}
            </label>
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
            <label className="custom-form-label">
              How often (h): {how_often_stand_up}
            </label>
            <input
              className="custom-form-input"
              type="range"
              min="1"
              max="5"
              step="1"
              value={how_often_stand_up}
              onChange={(e) => sethow_often_stand_up(Number(e.target.value))}
              onWheel={(e) =>
                handleWheel(e, how_often_stand_up, sethow_often_stand_up, 1, 5, 1)
              }
            />
          </div>
        )}

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

      <button className="custom-back-button" onClick={handleBack}>
        Back
      </button>
    </div>
  );
};

export default GameForm;
