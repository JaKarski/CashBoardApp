import React from 'react';
import './WorkInProgress.css'; // Import stylów

const WorkInProgress = () => {
    return (
        <div className="wip-container">
            <div className="card-stack">
                <div className="card under-construction">🛠️</div>
                <div className="card joker">J♣</div>
                <div className="card nine-of-hearts">9♥</div>
            </div>
            <h1 className="wip-title">Work in Progress</h1>
            <p className="wip-text">We are still dealing the cards! Check back soon to see the final hand.</p>
            <button className="back-home" onClick={() => window.location.href = "/"}>Back to Home</button>
        </div>
    );
};

export default WorkInProgress;
