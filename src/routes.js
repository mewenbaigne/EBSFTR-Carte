// src/routes.js
// import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import BaseAppLayout from './layouts/BaseAppLayout.js';
import Login from './pages/Login.js';
import MapApp from './pages/MapApp.js';
import NotFound from './pages/MapApp.js';

const isAuthenticated = localStorage?.isAuthenticated || false

const routes = [
  {
    path: '/',
    element: <BaseAppLayout />,
    children: [
      { path: '', element: isAuthenticated ? <MapApp /> : <Navigate to="/login" /> },
      { path: 'login', element: isAuthenticated ? <Navigate to="/" /> : <Login /> },
    ],
  },
//   {
//     path: 'admin',
//     element: <BaseAppLayout />,
//     children: [
//       { path: 'mapapp', element: <MapApp /> },
//     ],
//   },
  {
    path: '*',
    element: <Navigate to="/login" />,
  },
];

export default routes;
