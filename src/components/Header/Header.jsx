import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthProvider';
import './Header.css';

const Header = () => {
  const { userProfile, isAdmin } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo-link">
          <img 
            src="https://cdn.tbank.ru/static/pages/files/d39e9d26-fd5e-4574-9ad3-c3f2fc102598.png" 
            alt="T-Coworking Logo" 
            className="header__logo"
          />
          <span className="header__title">T-Coworking</span>
        </Link>
        
        <div className="header__actions">
          {isAdmin && (
            <Link to="/admin-space" className="header__action-link">
              <div className="header__action-icon-wrapper">
                <svg className="header__action-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.325 2.31667C8.825 1.96667 9.4 1.66667 10 1.66667C10.6 1.66667 11.175 1.96667 11.675 2.31667C12.15 2.65 12.7 2.75 13.225 2.58333C13.975 2.33333 14.8 2.58333 15.3 3.25C15.8 3.91667 15.8 4.83333 15.4 5.5C15.1 6 15.1 6.58333 15.4 7.08333C15.7 7.58333 16.0333 8.15 16.0333 8.75C16.0333 9.35 15.7333 9.91667 15.4 10.4167C15.1 10.9167 15.1 11.5 15.4 12C15.8 12.6667 15.8 13.5833 15.3 14.25C14.8 14.9167 13.975 15.1667 13.225 14.9167C12.7 14.75 12.15 14.85 11.675 15.1833C11.175 15.5333 10.6 15.8333 10 15.8333C9.4 15.8333 8.825 15.5333 8.325 15.1833C7.85 14.85 7.3 14.75 6.775 14.9167C6.025 15.1667 5.2 14.9167 4.7 14.25C4.2 13.5833 4.2 12.6667 4.6 12C4.9 11.5 4.9 10.9167 4.6 10.4167C4.26667 9.91667 3.96667 9.35 3.96667 8.75C3.96667 8.15 4.26667 7.58333 4.6 7.08333C4.9 6.58333 4.9 6 4.6 5.5C4.2 4.83333 4.2 3.91667 4.7 3.25C5.2 2.58333 6.025 2.33333 6.775 2.58333C7.3 2.75 7.85 2.65 8.325 2.31667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11.6667C11.3807 11.6667 12.5 10.5474 12.5 9.16671C12.5 7.78599 11.3807 6.66671 10 6.66671C8.61929 6.66671 7.5 7.78599 7.5 9.16671C7.5 10.5474 8.61929 11.6667 10 11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="header__action-text">Админ-панель</span>
            </Link>
          )}
          
          <Link to="/profile" className="header__action-link">
            {userProfile?.photo_url ? (
              <img 
                src={userProfile.photo_url} 
                alt={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`} 
                className="header__profile-avatar" 
              />
            ) : (
              <div className="header__profile-avatar-placeholder">
                {userProfile?.first_name ? userProfile.first_name.charAt(0) : ''}
                {userProfile?.last_name ? userProfile.last_name.charAt(0) : ''}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
