import React, { useEffect, useState } from "react";
import "./style.css";
import logoImg from "../../images/logo.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/api/login", {
        username,
        password,
      });
      const userData = response.data;
      localStorage.setItem("userData", JSON.stringify(userData));
      navigate("/home");
      console.log(response.data);
    } catch (error) {
      alert("Invalid username or password");
    }
  };

  const handleSubmitRegistration = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(regPassword)) {
      alert(
        "Password must be at least 8 characters long and contain at least one uppercase letter and one number."
      );
      return;
    }

    try {
      console.log(regUsername);
      console.log(regEmail);
      console.log(regPassword);
      console.log(regConfirmPassword);
      const response = await axios.post("http://localhost:8080/api/register", {
        regUsername,
        regEmail,
        regPassword,
        regConfirmPassword,
      });
      navigate("/home");
      alert("Welcome");
      console.log(response.data);
    } catch (error) {
      alert("Registration failed");
    }
  };

  useEffect(() => {
    const wrapper = document.querySelector(".wrapper");
    const signUpLink = document.querySelector(".signUp-link");
    const signInLink = document.querySelector(".signIn-link");

    if (!wrapper || !signUpLink || !signInLink) return;

    const signUpHandler = () => {
      wrapper.classList.add("animate-signIn");
      wrapper.classList.remove("animate-signUp");
    };

    const signInHandler = () => {
      wrapper.classList.add("animate-signUp");
      wrapper.classList.remove("animate-signIn");
    };

    signUpLink.addEventListener("click", signUpHandler);
    signInLink.addEventListener("click", signInHandler);

    return () => {
      signUpLink.removeEventListener("click", signUpHandler);
      signInLink.removeEventListener("click", signInHandler);
    };
  }, []);

  return (
    <body className="body-login">
      <div className="wrapper">
        <div className="form-wrapper sign-up">
          <form action="" onSubmit={handleSubmitRegistration}>
            <div className="header">
              <h2>Registration</h2>
              <img src={logoImg} alt="Fest" className="logo" />
            </div>
            <div className="input-group">
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <label htmlFor="">Username</label>
            </div>
            <div className="input-group">
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <label htmlFor="">Email</label>
            </div>
            <div className="input-group">
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <label htmlFor="">Password</label>
            </div>
            <div className="input-group">
              <input
                type="password"
                required
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
              <label htmlFor="">Confirm password</label>
            </div>
            <button className="btn" type="submit">
              Sign Up
            </button>
            <div className="sign-link">
              <p>
                Already have an account?
                <a href="#" className="signIn-link">
                  {" "}
                  Sign In{" "}
                </a>
              </p>
            </div>
          </form>
        </div>
        <div className="form-wrapper sign-in">
          <form action="" onSubmit={handleSubmit}>
            <div className="header">
              <h2>Login</h2>
              <img src={logoImg} alt="Fest" className="logo" />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label htmlFor="">Username</label>
            </div>
            <div className="input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="">Password</label>
            </div>
            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
            <button className="btn" type="submit">
              Login
            </button>
            <div className="sign-link">
              <p>
                Don't have an account?
                <a href="#" className="signUp-link">
                  {" "}
                  Sign Up{" "}
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </body>
  );
};

export default Login;
