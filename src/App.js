// src/App.js
import React from 'react';
import { HashRouter, useRoutes } from 'react-router-dom';
import routes from './routes.js';

const Routing = () => {
  const routing = useRoutes(routes);
  return routing
}

const App = () => {
  return (
    <div className="app">
      <HashRouter>
        <Routing />
      </HashRouter>
    </div>
  );
};

export default App;