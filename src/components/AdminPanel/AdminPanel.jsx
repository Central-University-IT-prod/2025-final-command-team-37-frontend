import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const [coworkings, setCoworkings] = useState([]);
  const [users, setUsers] = useState([]);
  const [coworkingPage, setCoworkingPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [coworkingStats, setCoworkingStats] = useState({
    totalCoworkings: 0,
    totalWorkspaces: 0,
    averagePrice: 0,
    occupancyRate: 0,
    priceRanges: [],
    workspaceTypes: []
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Кеширование данных
  const [coworkingCache, setCoworkingCache] = useState({});
  const [userCache, setUserCache] = useState({});
  const [allCoworkingsCache, setAllCoworkingsCache] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalCoworkings: 0,
    totalWorkplaces: 0,
    averagePrice: 0,
    statusDistribution: {}
  });
  
  const ITEMS_PER_PAGE = 10;
  const API_BASE_URL = 'https://prod-team-37-ajc3mefd.REDACTED/api/v1';

  // Получение JWT токена
  const getAuthHeader = () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  // Общая функция для выполнения защищенных запросов
  const fetchWithAuth = async (endpoint, options = {}) => {
    const authHeader = getAuthHeader();
    if (!authHeader) return null;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        navigate('/');
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка запроса:', error);
      return null;
    }
  };

  const fetchAllCoworkings = async () => {
    const data = await fetchWithAuth('/coworking/list?offset=0&limit=1000');
    if (data?.coworkings) {
      setAllCoworkingsCache(data.coworkings);
      calculateDashboardStats(data.coworkings);
    }
  };

  useEffect(() => {
    if (activeSection === 'dashboard' && !allCoworkingsCache) {
      fetchAllCoworkings();
    } else if (allCoworkingsCache) {
      calculateDashboardStats(allCoworkingsCache);
    }
  }, [activeSection, allCoworkingsCache]);

  useEffect(() => {
    if (activeSection === 'coworkings') {
      if (!coworkingCache[coworkingPage]) {
        fetchCoworkings();
      } else {
        setCoworkings(coworkingCache[coworkingPage] || []);
      }
    }
  }, [activeSection, coworkingPage]);

  useEffect(() => {
    if (activeSection === 'users' && !userCache[userPage]) {
      fetchUsers();
    } else if (activeSection === 'users') {
      setUsers(userCache[userPage] || []);
    }
  }, [activeSection, userPage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        !toggleButtonRef.current.contains(event.target) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const calculateDashboardStats = (coworkings) => {
    if (!coworkings || coworkings.length === 0) return;

    const stats = {
      totalCoworkings: coworkings.length,
      totalWorkplaces: 0,
      averagePrice: 0,
      statusDistribution: {}
    };

    let totalPrice = 0;
    let totalTariffs = 0;

    coworkings.forEach(coworking => {
      if (coworking.workplaces) {
        stats.totalWorkplaces += coworking.workplaces.length;
      }
      
      if (coworking.tariffs) {
        coworking.tariffs.forEach(tariff => {
          if (tariff.price_per_hour) {
            totalPrice += tariff.price_per_hour;
            totalTariffs++;
          }
        });
      }
    });

    stats.averagePrice = totalTariffs > 0 ? Math.round(totalPrice / totalTariffs) : 0;
    setDashboardStats(stats);
  };

  const fetchCoworkings = async () => {
    const data = await fetchWithAuth(`/coworking/list?offset=${coworkingPage * ITEMS_PER_PAGE}&limit=${ITEMS_PER_PAGE}`);
    if (data) {
      // Преобразуем объект в массив
      const coworkingsArray = Object.values(data);
      setCoworkingCache(prev => ({
        ...prev,
        [coworkingPage]: coworkingsArray
      }));
      setCoworkings(coworkingsArray);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth(`/user/list?offset=${userPage * ITEMS_PER_PAGE}&limit=${ITEMS_PER_PAGE}`);
      if (Array.isArray(response)) {
        const formattedUsers = response.map(user => ({
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          balance: user.balance || 0,
          photo_url: user.photo_url || '',
          role: user.role || 'USER',
          created_at: user.created_at || 0
        }));
        
        setUserCache(prev => ({
          ...prev,
          [userPage]: formattedUsers
        }));
        setUsers(formattedUsers);
      } else {
        console.error('Неверный формат ответа:', response);
        setUsers([]);
      }
    } catch (error) {
      console.error('Ошибка при получении списка пользователей:', error);
      setUsers([]);
    }
  };

  const handleAddCoworking = () => {
    navigate('/admin-space/workspace/add');
  };

  const handleCoworkingClick = (coworkingId) => {
    navigate(`/admin-space/workspace?coworking_id=${coworkingId}`);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleDeleteCoworking = async (coworkingId, event) => {
    event.stopPropagation();
    
    if (window.confirm('Вы уверены, что хотите удалить этот коворкинг?')) {
      const authHeader = getAuthHeader();
      if (!authHeader) return;

      try {
        const response = await fetch(`${API_BASE_URL}/coworking/${coworkingId}/delete`, {
          method: 'DELETE',
          headers: {
            ...authHeader,
          }
        });

        if (response.ok) {
          setShowSuccessModal(true);
          // Обновляем кеш и текущий список
          const updatedCoworkings = coworkings.filter(c => c.id !== coworkingId);
          setCoworkings(updatedCoworkings);
          setCoworkingCache(prev => ({
            ...prev,
            [coworkingPage]: updatedCoworkings
          }));
          
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 3000);
        } else {
          console.error('Ошибка при удалении коворкинга');
        }
      } catch (error) {
        console.error('Ошибка при удалении:', error);
      }
    }
  };

  const fetchStatistics = async () => {
    try {
      const [coworkingCount, workplacesCount, mediumPrice, occupancyRate] = await Promise.all([
        fetchWithAuth('/stats/coworking-count'),
        fetchWithAuth('/stats/workplaces-count'),
        fetchWithAuth('/stats/medium-price-per-hour'),
        fetchWithAuth('/stats/occupancy-rate')
      ]);

      setCoworkingStats({
        totalCoworkings: parseInt(coworkingCount) || 0,
        totalWorkspaces: parseInt(workplacesCount) || 0,
        averagePrice: parseInt(mediumPrice) || 0,
        occupancyRate: parseInt(occupancyRate) || 0,
        priceRanges: [
          { name: '0-500₽', value: Math.floor(Math.random() * 50) },
          { name: '500-1000₽', value: Math.floor(Math.random() * 50) },
          { name: '1000-2000₽', value: Math.floor(Math.random() * 30) },
          { name: '2000+₽', value: Math.floor(Math.random() * 20) }
        ],
        workspaceTypes: [
          { name: 'Отдельный стол', value: Math.floor(Math.random() * 100) },
          { name: 'Общий стол', value: Math.floor(Math.random() * 80) },
          { name: 'Переговорная', value: Math.floor(Math.random() * 40) },
          { name: 'Кабинет', value: Math.floor(Math.random() * 30) }
        ]
      });
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchStatistics();
    }
  }, [activeSection]);

  return (
    <div className="admin-panel">
      <div 
        className={`menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      <div 
        ref={sidebarRef}
        className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
      >
        
        <nav className="admin-sidebar__nav">
          <button 
            className={`admin-sidebar__nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('dashboard');
              setIsMobileMenuOpen(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Статистика</span>
          </button>
          
          <button 
            className={`admin-sidebar__nav-item ${activeSection === 'coworkings' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('coworkings');
              setIsMobileMenuOpen(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 5.83333L10 1.66667L2.5 5.83333L10 10L17.5 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 14.1667L10 18.3333L17.5 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 10L10 14.1667L17.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Коворкинги</span>
          </button>
          
          <button 
            className={`admin-sidebar__nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('users');
              setIsMobileMenuOpen(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3333 5.83333C13.3333 7.67428 11.8409 9.16667 10 9.16667C8.15905 9.16667 6.66666 7.67428 6.66666 5.83333C6.66666 3.99238 8.15905 2.5 10 2.5C11.8409 2.5 13.3333 3.99238 13.3333 5.83333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11.6667C6.77834 11.6667 4.16667 14.2783 4.16667 17.5H15.8333C15.8333 14.2783 13.2217 11.6667 10 11.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Пользователи</span>
          </button>
        </nav>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <>
            <button className="back-arrow" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="admin-header__title">
              {activeSection === 'dashboard' && 'Статистика'}
              {activeSection === 'coworkings' && 'Коворкинги'}
              {activeSection === 'users' && 'Пользователи'}
            </h1>
          </>
          <button 
            ref={toggleButtonRef}
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-label="Открыть меню"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {activeSection === 'dashboard' && (
          <div className="admin-dashboard">
            <div className="admin-dashboard__stats">
              <div className="admin-stat-card">
                <div className="admin-stat-card__icon workspaces">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 7H7V9H9V7Z" fill="currentColor"/>
                    <path d="M9 11H7V13H9V11Z" fill="currentColor"/>
                    <path d="M9 15H7V17H9V15Z" fill="currentColor"/>
                    <path d="M13 7H11V9H13V7Z" fill="currentColor"/>
                    <path d="M13 11H11V13H13V11Z" fill="currentColor"/>
                    <path d="M13 15H11V17H13V15Z" fill="currentColor"/>
                    <path d="M17 7H15V9H17V7Z" fill="currentColor"/>
                    <path d="M17 11H15V13H17V11Z" fill="currentColor"/>
                    <path d="M17 15H15V17H17V15Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="admin-stat-card__content">
                  <h3 className="admin-stat-card__title">Всего коворкингов</h3>
                  <p className="admin-stat-card__value">{coworkingStats.totalCoworkings}</p>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-card__icon users">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="admin-stat-card__content">
                  <h3 className="admin-stat-card__title">Всего рабочих мест</h3>
                  <p className="admin-stat-card__value">{coworkingStats.totalWorkspaces}</p>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-card__icon price">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="admin-stat-card__content">
                  <h3 className="admin-stat-card__title">Средняя цена за час</h3>
                  <p className="admin-stat-card__value">{coworkingStats.averagePrice}₽</p>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-card__icon load">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="admin-stat-card__content">
                  <h3 className="admin-stat-card__title">Занятость мест</h3>
                  <p className="admin-stat-card__value">{coworkingStats.occupancyRate}%</p>
                </div>
              </div>
            </div>

            <div className="admin-dashboard__charts">
              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">Распределение по ценам</h3>
                <div className="admin-chart-container">
                  <BarChart 
                    width={500} 
                    height={300} 
                    data={coworkingStats.priceRanges}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748B' }} 
                      axisLine={{ stroke: '#EAEAEA' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748B' }} 
                      axisLine={{ stroke: '#EAEAEA' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white', 
                        border: '1px solid #EAEAEA',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar 
                      dataKey="value" 
                      name="Количество рабочих мест" 
                      fill="#6366F1" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </div>
              </div>

              <div className="admin-chart-card">
                <h3 className="admin-chart-card__title">Типы рабочих мест</h3>
                <div className="admin-chart-container">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={coworkingStats.workspaceTypes}
                      cx={200}
                      cy={150}
                      labelLine={false}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      animationDuration={1000}
                    >
                      {coworkingStats.workspaceTypes.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} мест`, 'Количество']}
                      contentStyle={{ 
                        background: 'white', 
                        border: '1px solid #EAEAEA',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'coworkings' && (
          <div className="admin-section">
            <div className="admin-section__header">
              <button className="admin-button primary" onClick={handleAddCoworking}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.33331V12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Добавить коворкинг
              </button>
            </div>

            <div className="admin-list">
              {coworkings.length > 0 ? (
                coworkings.map(coworking => (
                  <div 
                    key={coworking.id} 
                    className="admin-list-item admin-list-item--coworking"
                    onClick={() => handleCoworkingClick(coworking.id)}
                  >
                    <div className="admin-list-item__coworking">
                      {coworking.photo_url ? (
                        <img 
                          src={coworking.photo_url}
                          alt={coworking.name}
                          className="admin-list-item__coworking-icon"
                          style={{ objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/48';
                          }}
                        />
                      ) : (
                        <div className="admin-list-item__coworking-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#2481CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      <div className="admin-list-item__coworking-info">
                        <h3 className="admin-list-item__title">{coworking.name}</h3>
                        <p className="admin-list-item__subtitle">{coworking.address}</p>
                        <div className="admin-list-item__details">
                          <span className="admin-list-item__description">
                            {coworking.description}
                          </span>
                          <button 
                            className="admin-button danger"
                            onClick={(e) => handleDeleteCoworking(coworking.id, e)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-list-item admin-list-item--empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 7H7V9H9V7Z" fill="#CBD5E1"/>
                    <path d="M9 11H7V13H9V11Z" fill="#CBD5E1"/>
                    <path d="M9 15H7V17H9V15Z" fill="#CBD5E1"/>
                    <path d="M13 7H11V9H13V7Z" fill="#CBD5E1"/>
                    <path d="M13 11H11V13H13V11Z" fill="#CBD5E1"/>
                    <path d="M13 15H11V17H13V15Z" fill="#CBD5E1"/>
                    <path d="M17 7H15V9H17V7Z" fill="#CBD5E1"/>
                    <path d="M17 11H15V13H17V11Z" fill="#CBD5E1"/>
                    <path d="M17 15H15V17H17V15Z" fill="#CBD5E1"/>
                  </svg>
                  <p>Коворкинги не найдены</p>
                </div>
              )}
            </div>

            <div className="admin-pagination">
              <button 
                className="admin-button secondary"
                disabled={coworkingPage === 0}
                onClick={() => setCoworkingPage(prev => prev - 1)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Назад
              </button>
              <span className="admin-pagination__page">{coworkingPage + 1}</span>
              <button 
                className="admin-button secondary"
                disabled={coworkings.length < ITEMS_PER_PAGE}
                onClick={() => setCoworkingPage(prev => prev + 1)}
              >
                Вперед
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {activeSection === 'users' && (
          <div className="admin-section">
            <div className="admin-list">
              {users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="admin-list-item">
                    <div className="admin-list-item__user">
                      {user.photo_url ? (
                        <img 
                          src={user.photo_url} 
                          alt={`${user.first_name || user.username}`} 
                          className="admin-list-item__user-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/48';
                          }}
                        />
                      ) : (
                        <div className="admin-list-item__user-avatar" style={{
                          background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          color: 'white'
                        }}>
                          {user.first_name?.[0] || user.username?.[0] || '?'}
                        </div>
                      )}
                      <div className="admin-list-item__user-info">
                        <h3 className="admin-list-item__title">
                          {user.first_name || user.username}
                        </h3>
                        <p className="admin-list-item__subtitle">
                          @{user.username}
                        </p>
                        <div className="admin-list-item__details">
                          <span className="admin-list-item__role">
                            {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                          </span>
                          <span className="admin-list-item__balance">
                            Баланс: {user.balance?.toLocaleString('ru-RU')}₽
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-list-item admin-list-item--empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>Пользователи не найдены</p>
                </div>
              )}
            </div>

            <div className="admin-pagination">
              <button 
                className="admin-button secondary"
                disabled={userPage === 0}
                onClick={() => setUserPage(prev => prev - 1)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Назад
              </button>
              <span className="admin-pagination__page">{userPage + 1}</span>
              <button 
                className="admin-button secondary"
                disabled={users.length < ITEMS_PER_PAGE}
                onClick={() => setUserPage(prev => prev + 1)}
              >
                Вперед
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccessModal && (
        <div className="success-modal">
          <div className="success-modal__content">
            <div className="success-modal__icon">
              🎉
            </div>
            <h3>Успешно удалено!</h3>
            <p>Коворкинг был успешно удален из системы</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 