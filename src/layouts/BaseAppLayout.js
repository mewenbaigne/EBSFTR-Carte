// src/layouts/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import ToolBar from '../components/ToolBar.js';
import "./BaseAppLayout.css"

const BaseAppLayout = () => {
  return (
    <div>
      <ToolBar />
      <div className="main-page">
        {/* Outlet rend le contenu de la route enfant dans ce layout */}
        <Outlet />
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default BaseAppLayout;
