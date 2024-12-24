import React from 'react';
import "./NotFound.css"

const NotFound = () => {
    return (
        <div className="not-found-container">
            <div className="card-stack">
                <div className="card ace-of-spades">A♠</div>
                <div className="card king-of-hearts">K♥</div>
                <div className="card queen-of-diamonds">Q♦</div>
            </div>
            <h1 className="error-title">404 - Lost in the shuffle</h1>
            <p className="error-text">Looks like the page you're looking for was a bad beat. Try your luck again!</p>
            <button className="back-home" onClick={() => window.location.href = "/"}>Back to Home</button>
        </div>
    );
};

export default NotFound;
