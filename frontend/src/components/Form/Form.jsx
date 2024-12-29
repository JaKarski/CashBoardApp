import { useState, useEffect } from "react";
import { toast } from "react-toastify"; // Import toast for notifications
import "react-toastify/dist/ReactToastify.css"; // Import default styles
import api from "../../api"; // Replace with your actual API module
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import "./Form.css"; // Replace with your actual CSS file

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    if (accessToken) {
      navigate("/"); // Redirect to the homepage if the user is already logged in
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = { username, password };
    if (method === "register") {
      data.email = email;
      data.first_name = firstName;
      data.last_name = lastName;
      data.phone_number = phoneNumber;
    }

    try {
      const response = await api.post(route, data);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        toast.success("Logged in successfully!");
        navigate("/");
      } else {
        toast.success("Registration successful! Please log in.");
        navigate("/login");
      }
    } catch (error) {
      handleErrors(error);
    } finally {
      setLoading(false);
    }
  };

  const handleErrors = (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        toast.error("Incorrect username or password.");
      } else if (error.response.data) {
        Object.entries(error.response.data).forEach(([key, messages]) => {
          messages.forEach((msg) => {
            toast.error(`${key}: ${msg}`);
          });
        });
      } else {
        toast.error("An unexpected error occurred.");
      }
    } else {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>

      {/* Username field */}
      <div className="form-group">
        <input
          className="form-input"
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder=" "
        />
        <label className="form-label" htmlFor="username">Username</label>
      </div>

      {/* Password field */}
      <div className="form-group">
        <input
          className="form-input"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" "
        />
        <label className="form-label" htmlFor="password">Password</label>
      </div>

      {/* Additional fields for registration */}
      {method === "register" && (
        <>
          <div className="form-group">
            <input
              className="form-input"
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder=" "
            />
            <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
          </div>
          <div className="form-group">
            <input
              className="form-input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
            />
            <label className="form-label" htmlFor="email">Email</label>
          </div>
          <div className="form-group">
            <input
              className="form-input"
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder=" "
            />
            <label className="form-label" htmlFor="firstName">First Name</label>
          </div>
          <div className="form-group">
            <input
              className="form-input"
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder=" "
            />
            <label className="form-label" htmlFor="lastName">Last Name</label>
          </div>
        </>
      )}

      {/* Submit button */}
      <button className="form-button" type="submit" disabled={loading}>
        {loading ? "Loading..." : name}
      </button>

      {/* Switch between login and register */}
      {method === "login" ? (
        <p className="switch-form">
          Don't have an account? {/*<a href="/register" className="switch-link">Register</a>*/} Contact us!
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
