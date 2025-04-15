import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MainPage.css';
import { AuthContext } from '../AuthProvider';

// Импортируем изображения
import coworkHole from '../images/cowork-in-hole.jpg';
import coworkCafe from '../images/cowork-in-caffee.jpg';

const coworkingSpaces = [
  {
    id: 1,
    name: 'Коворкинг в актовом зале',
    address: 'Московская область, Богородский район, южнее 1км. д. Жилино',
    image: coworkHole,
    mapUrl: 'https://yandex.ru/map-widget/v1/?um=constructor%3A7f2d44bd204cebf569af0a76cf9b742e29cc28f23c4f8784b4c01464dd9230e6&amp;source=constructor&amp;scroll=false'
  },
  {
    id: 2,
    name: 'Коворкинг в Кофе-брейке',
    address: 'Московская область, Богородский район, южнее 1км. д. Жилино',
    image: coworkCafe,
    mapUrl: 'https://yandex.ru/map-widget/v1/?um=constructor%3A4358e540da9944ef8495b937e4b33ccf60fc4373a6c3feac579d3c8fa6a4c40f&amp;source=constructor&amp;scroll=false'
  },
  {
    id: 3,
    name: 'Основной коворкинг',
    address: 'Московская область, Богородский район, южнее 1км. д. Жилино',
    image: coworkHole,
    mapUrl: 'https://yandex.ru/map-widget/v1/?um=constructor%3A9abd86ab36cf971f1d7555ee5b74d6fb16f174fa872868015ec11942317316f0&amp;source=constructor&amp;scroll=false'
  },
];

const MainPage = () => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [coworkings, setCoworkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token, getAuthHeaders, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!authLoading && token) {
      const fetchCoworkings = async () => {
        try {
          const response = await axios.get(
            'https://prod-team-37-ajc3mefd.REDACTED/api/v1/coworking/list?offset=0&limit=1000',
            { headers: getAuthHeaders() }
          );
          setCoworkings(response.data);
          setLoading(false);
        } catch (err) {
          setError('Ошибка при загрузке списка коворкингов');
          setLoading(false);
          console.error(err);
        }
      };
      fetchCoworkings();
    }
  }, [token, getAuthHeaders, authLoading]);

  const handleSpaceClick = (coworking) => {
    navigate(`/user-space/${coworking.id}`);
  };

  const renderSpaceBlock = (coworking) => (
    <div key={coworking.id} className="space-block">
      <div 
        className="space-content"
        onClick={() => handleSpaceClick(coworking)}
      >
        <div className="image-section" style={{
          backgroundImage: `url(${coworking.cover_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'var(--background-color, #F5F5F7)'
        }}>
        </div>
        <div className="info-section">
          <div className="space-name">{coworking.name}</div>
          <div className="address">{coworking.address}</div>
        </div>
      </div>
      <div 
        className="map-icon" 
        onClick={() => setSelectedSpace({ ...coworking, showMap: true })}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#666"/>
        </svg>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="instruction">
        <h3 className="instruction__title">Как забронировать коворкинг</h3>
        <p className="instruction__text">Выберите подходящий коворкинг из списка ниже, нажмите на карточку для бронирования или на иконку карты для просмотра местоположения.</p>
      </div>
      
      <div className="spaces-list">
        {coworkings.map(renderSpaceBlock)}
      </div>

      {selectedSpace && (
        <div className="modal" onClick={() => setSelectedSpace(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-container">
                <button className="back-arrow" onClick={() => setSelectedSpace(null)}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <h2>{selectedSpace.name}</h2>
              </div>
            </div>
            <div className="modal-body">
              {selectedSpace.showMap ? (
                <iframe 
                  src={selectedSpace.map_url || "https://yandex.ru/map-widget/v1/?um=constructor%3A7f2d44bd204cebf569af0a76cf9b742e29cc28f23c4f8784b4c01464dd9230e6"}
                  width="100%" 
                  height="500px" 
                  frameBorder="0"
                  title={`Карта ${selectedSpace.name}`}
                />
              ) : (
                <div>
                  <p>Адрес: {selectedSpace.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
