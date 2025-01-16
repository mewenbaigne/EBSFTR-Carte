// src/pages/Login.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'EBSFTR - Authentification';
  })

  const handleLogin = () => {
    // Logique d'authentification
    if (password === 'eb170769') {
      localStorage.setItem("isAuthenticated", true)
      navigate('/');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  return (
    <div className="auth-dialog">
      <h2>Authentification requise</h2>
      <form onSubmit={handleLogin}>
        <label>
          Mot de passe :
          <input
            type="password"
            placeholder='Mot de passe'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
};

export default Login;
