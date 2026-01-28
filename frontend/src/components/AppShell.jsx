import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppShell = () => (
  <div className="app-shell">
    <Sidebar />
    <main className="app-main">
      <TopBar />
      <div className="page-content">
        <Outlet />
      </div>
    </main>
  </div>
);

export default AppShell;
