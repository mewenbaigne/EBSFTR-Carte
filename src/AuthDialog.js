// src/AuthDialog.js
import React, { useState } from 'react';

const AuthDialog = ({ onAuthenticate }) => {
  const [password, setPassword] = useState("");
  const correctPassword = "eb170769"; // Mot de passe à vérifier

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      localStorage.setItem("isAuthenticated", "true"); // Enregistrer l'authentification
      onAuthenticate(true); // Appeler la fonction pour mettre à jour l'authentification dans l'application principale
    } else {
      alert("Mot de passe incorrect. Accès refusé.");
    }
  };

  return (
    <div className="auth-dialog">
      <h2>Authentification requise</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Mot de passe :
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
};

export default AuthDialog;