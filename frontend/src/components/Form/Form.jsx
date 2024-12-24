import { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import "./Form.css"

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");           // Stan dla email
    const [firstName, setFirstName] = useState("");   // Stan dla imienia
    const [lastName, setLastName] = useState("");     // Stan dla nazwiska
    const [phoneNumber, setPhoneNumber] = useState("");     // Stan dla nazwiska
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    // Sprawdzanie, czy użytkownik jest zalogowany
    useEffect(() => {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        if (accessToken) {
            navigate("/"); // Jeśli użytkownik ma token, przekieruj go na stronę główną
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        // Zbierz dane dla loginu lub rejestracji
        const data = { username, password };
        if (method === "register") {
            data.email = email;
            data.first_name = firstName;
            data.last_name = lastName;
            data.phone_number = phoneNumber;
        }

        try {
            const res = await api.post(route, data);
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                navigate("/login");
            }
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>

            {/* Pole użytkownika */}
            <div className="form-group">
                <input
                    className="form-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=" "
                />
                <label className="form-label">Username</label>
            </div>

            {/* Pole hasła */}
            <div className="form-group">
                <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                />
                <label className="form-label">Password</label>
            </div>

            {/* Dodatkowe pola dla rejestracji */}
            {method === "register" && (
                <>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder=" "
                        />
                        <label className="form-label">Phone Number</label>
                    </div>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder=" "
                        />
                        <label className="form-label">Email</label>
                    </div>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder=" "
                        />
                        <label className="form-label">First Name</label>
                    </div>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder=" "
                        />
                        <label className="form-label">Last Name</label>
                    </div>
                </>
            )}

            <button className="form-button" type="submit" disabled={loading}>
                {loading ? "Loading..." : name}
            </button>

            {/* Dodajemy przyciski zmiany między logowaniem i rejestracją */}
            {method === "login" ? (
                <p className="switch-form">
                    Don't have an account? <a href="/register" className="switch-link">Register</a>
                </p>
            ) : (
                <p className="switch-form">
                    Already have an account? <a href="/login" className="switch-link">Login</a>
                </p>
            )}
        </form>
    );
}

export default Form;
