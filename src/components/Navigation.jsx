import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ pages, title, layout = 'top' }) => {
  return (
    <nav className={`nav-container glass ${layout === 'sidebar' ? 'nav-sidebar' : 'nav-top'}`}>
      <div className="nav-content">
        <h1 className="nav-title">{title}</h1>
        <div className="nav-links">
          {pages.map(page => (
            <NavLink 
              key={page.id} 
              to={`/${page.id}`}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              {page.title}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
