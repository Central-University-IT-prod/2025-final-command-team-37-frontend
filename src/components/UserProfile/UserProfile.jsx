import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthProvider';
import './UserProfile.css';

const UserProfile = () => {
  const { userProfile, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (profileRef.current) {
        const scrollPosition = window.scrollY;
        const threshold = 100; // Порог прокрутки для изменения вида
        setScrolled(scrollPosition > threshold);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="user-profile">
        <div className="user-profile__header">
          <button className="user-profile__back-button" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="user-profile__title">Профиль пользователя</h1>
        </div>
        <div className="user-profile__skeleton">
          <div className="user-profile__skeleton-avatar"></div>
          <div className="user-profile__skeleton-content">
            <div className="user-profile__skeleton-line"></div>
            <div className="user-profile__skeleton-line user-profile__skeleton-line--short"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile">
        <div className="user-profile__header">
          <button className="user-profile__back-button" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="user-profile__title">Профиль пользователя</h1>
        </div>
        <div className="user-profile__error">
          <h2>Профиль не найден</h2>
          <p>Не удалось загрузить данные профиля</p>
          <button className="user-profile__button" onClick={handleGoBack}>Вернуться назад</button>
        </div>
      </div>
    );
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Дата не указана';
    
    try {
      const date = new Date(dateString);
      
      // Проверяем валидность даты
      if (isNaN(date.getTime())) {
        return 'Некорректная дата';
      }

      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error);
      return 'Ошибка форматирования даты';
    }
  };

  return (
    <div className="user-profile" ref={profileRef}>
      <div className={`user-profile__header ${scrolled ? 'user-profile__header--scrolled' : ''}`} ref={headerRef}>
        <button className="user-profile__back-button" onClick={handleGoBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="user-profile__header-content">
          {scrolled && (
            <>
              {userProfile.photo_url ? (
                <img 
                  src={userProfile.photo_url} 
                  alt={`${userProfile.first_name} ${userProfile.last_name || ''}`} 
                  className="user-profile__header-avatar" 
                />
              ) : (
                <div className="user-profile__header-avatar-placeholder">
                  {userProfile.first_name.charAt(0)}
                  {userProfile.last_name ? userProfile.last_name.charAt(0) : ''}
                </div>
              )}
              <h1 className="user-profile__header-name">
                {userProfile.first_name} {userProfile.last_name || ''}
              </h1>
            </>
          )}
          {!scrolled && (
            <h1 className="user-profile__title">Профиль пользователя</h1>
          )}
        </div>
      </div>

      <div className="user-profile__hero">
        <div className="user-profile__avatar-container">
          {userProfile.photo_url ? (
            <img 
              src={userProfile.photo_url} 
              alt={`${userProfile.first_name} ${userProfile.last_name || ''}`} 
              className="user-profile__avatar" 
            />
          ) : (
            <div className="user-profile__avatar-placeholder">
              {userProfile.first_name.charAt(0)}
              {userProfile.last_name ? userProfile.last_name.charAt(0) : ''}
            </div>
          )}
        </div>
        <div className="user-profile__hero-info">
          <h2 className="user-profile__name">
            {userProfile.first_name} {userProfile.last_name || ''}
          </h2>
          <p className="user-profile__username">@{userProfile.username}</p>
          <div className="user-profile__status">
            {userProfile.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
          </div>
        </div>
      </div>

      <div className="user-profile__content">
        <div className="user-profile__details">
          <div className="user-profile__detail-item">
            <div className="user-profile__detail-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 5.83334V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-profile__detail-content">
              <span className="user-profile__detail-label">Дата регистрации</span>
              <span className="user-profile__detail-value">{formatDate(userProfile.created_at)}</span>
            </div>
          </div>
          
          <div className="user-profile__detail-item">
            <div className="user-profile__detail-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 5.83334L10 1.66667L2.5 5.83334L10 10L17.5 5.83334Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 14.1667L10 18.3333L17.5 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 10L10 14.1667L17.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-profile__detail-content">
              <span className="user-profile__detail-label">Баланс</span>
              <span className="user-profile__detail-value">{userProfile.balance} ₽</span>
            </div>
          </div>
          
          <div className="user-profile__detail-item">
            <div className="user-profile__detail-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.25 17.5C16.25 14.6066 13.4434 12.25 10 12.25C6.55661 12.25 3.75 14.6066 3.75 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="user-profile__detail-content">
              <span className="user-profile__detail-label">Telegram ID</span>
              <span className="user-profile__detail-value">{userProfile.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 