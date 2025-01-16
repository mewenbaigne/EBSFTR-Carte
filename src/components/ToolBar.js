// src/layouts/MainLayout.js
import React from 'react';

const ToolBar = () => {
  return (
    <div>
      <div className="app-toolbar">
            <img
                src={`${process.env.PUBLIC_URL || ""}/svg/toolbar_minimize.svg`}
                alt="Minimize"
                className="toolbar-button"
                onClick={() => window.electron.minimize()}
            />
            <img
                src={`${process.env.PUBLIC_URL || ""}/svg/toolbar_maximize.svg`}
                alt="Maximize"
                className="toolbar-button"
                onClick={() => window.electron.maximize()}
            />
            <img
                src={`${process.env.PUBLIC_URL || ""}/svg/toolbar_close.svg`}
                alt="Close"
                className="toolbar-button"
                onClick={() => window.electron.close()}
            />
        </div>
    </div>
  );
};

export default ToolBar;