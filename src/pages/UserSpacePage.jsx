import React, { useRef, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './AdminSpacePage.css';
import planImage from '../images/cowork-in-hole.jpg';
import { AuthContext } from '../AuthProvider';

const UserSpacePage = () => {
  const navigate = useNavigate();
  const { coworkingId } = useParams();
  const { loading: authLoading, token, getAuthHeaders } = useContext(AuthContext);
  
  const [coworkingData, setCoworkingData] = useState(null);
  const [tariffs, setTariffs] = useState({});
  const [workplaces, setWorkplaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [lastBookingId, setLastBookingId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const pinchInitRef = useRef(null);
  const [selectedWorkplace, setSelectedWorkplace] = useState(null);
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [showBookingError, setShowBookingError] = useState(false);
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const isGestureActiveRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const CIRCLE_SIZE = useMemo(() => {
    const baseSize = Math.min(containerSize.width || 300, containerSize.height || 300);
    return baseSize * 0.025;
  }, [containerSize]);

  const updateContainerSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerSize({
      width: rect.width,
      height: rect.height
    });
  }, []);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    updateContainerSize();
  }, [updateContainerSize]);

  const applyTransform = useCallback((newTransform) => {
    newTransform.scale = Math.min(Math.max(newTransform.scale, 1), 4);
    const maxTranslateX = (newTransform.scale - 1) * containerSize.width / 1.5;
    const maxTranslateY = (newTransform.scale - 1) * containerSize.height / 1.5;

    if (newTransform.scale === 1) {
      newTransform.translateX = 0;
      newTransform.translateY = 0;
    } else {
      newTransform.translateX = Math.min(Math.max(newTransform.translateX, -maxTranslateX * 1.2), maxTranslateX * 1.2);
      newTransform.translateY = Math.min(Math.max(newTransform.translateY, -maxTranslateY * 1.2), maxTranslateY * 1.2);
    }

    setTransform(newTransform);
  }, [containerSize]);

  const startDrag = useCallback((clientX, clientY) => {
    lastPointerPosRef.current = { x: clientX, y: clientY };
    hasDraggedRef.current = false;
    setIsDragging(true);
    isGestureActiveRef.current = true;
  }, []);

  const doDrag = useCallback((clientX, clientY) => {
    if (!isDragging) return;

    const dx = clientX - lastPointerPosRef.current.x;
    const dy = clientY - lastPointerPosRef.current.y;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

    hasDraggedRef.current = true;

    applyTransform({
      ...transform,
      translateX: transform.translateX + dx,
      translateY: transform.translateY + dy
    });

    lastPointerPosRef.current = { x: clientX, y: clientY };
  }, [isDragging, transform, applyTransform]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    isGestureActiveRef.current = false;
    hasDraggedRef.current = false;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.workspace-circle')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  const handleMouseMove = useCallback((e) => {
    doDrag(e.clientX, e.clientY);
  }, [doDrag]);

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const direction = e.deltaY < 0 ? 1 : -1;
    const scaleFactor = direction * 0.1;
    const newScale = transform.scale * (1 + scaleFactor);

    const dx = (mouseX - rect.width / 2) * scaleFactor;
    const dy = (mouseY - rect.height / 2) * scaleFactor;

    applyTransform({
      scale: newScale,
      translateX: transform.translateX - dx,
      translateY: transform.translateY - dy
    });
  }, [transform, applyTransform]);

  const getWorkspaceCoordinates = useCallback((workspace) => {
    const percentToPixelX = (percent) => containerSize.width * parseFloat(percent) / 100;
    const percentToPixelY = (percent) => containerSize.height * parseFloat(percent) / 100;

    const baseX = percentToPixelX(workspace.x);
    const baseY = percentToPixelY(workspace.y);

    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    const offsetX = baseX - centerX;
    const offsetY = baseY - centerY;

    const scaledX = centerX + offsetX * transform.scale;
    const scaledY = centerY + offsetY * transform.scale;

    return {
      x: scaledX + transform.translateX,
      y: scaledY + transform.translateY
    };
  }, [containerSize, transform]);

  const fetchWorkplaces = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://prod-team-37-ajc3mefd.REDACTED/api/v1/workplace/list?coworking_id=${coworkingId}`,
        { headers: getAuthHeaders() }
      );
      const workplacesMap = {};
      response.data.forEach(workplace => {
        workplacesMap[workplace.number] = {
          id: workplace.id,
          number: workplace.number,
          name: workplace.name,
          status: workplace.status,
          tariff: workplace.tariff,
          x: `${workplace.x_cor}`,
          y: `${workplace.y_cor}`,
          created_at: workplace.created_at
        };
      });
      setWorkplaces(workplacesMap);
    } catch (err) {
      setError('Ошибка при загрузке рабочих мест');
      console.error(err);
    }
  }, [coworkingId, getAuthHeaders]);

  const fetchTariffs = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://prod-team-37-ajc3mefd.REDACTED/api/v1/coworking/${coworkingId}/tariffs/list`,
        { headers: getAuthHeaders() }
      );
      const tariffsMap = {};
      response.data.forEach(tariff => {
        tariffsMap[tariff.id] = {
          id: tariff.id,
          name: tariff.name,
          price: tariff.price_per_hour,
          color: tariff.color
        };
      });
      setTariffs(tariffsMap);
    } catch (err) {
      console.error('Ошибка при загрузке тарифов:', err);
      setError('Не удалось загрузить тарифы');
    }
  }, [coworkingId, getAuthHeaders]);

  const getTariffColor = useCallback((tariff) => {
    return tariff?.color || '#666666';
  }, []);

  const handleMarkerClick = useCallback((key) => {
    if (hasDraggedRef.current) return;

    const workplace = workplaces[key];
    if (workplace.status === 'BOOKED') {
      setError('Это место уже забронировано');
      return;
    }

    setSelectedWorkspaces(prevSelected => {
      if (prevSelected.includes(key)) {
        return prevSelected.filter(item => item !== key);
      } else if (prevSelected.length >= 3) {
        setShowError(true);
        return prevSelected;
      } else {
        return [...prevSelected, key];
      }
    });
  }, [workplaces]);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://prod-team-37-ajc3mefd.REDACTED/api/v1/bookings/list/coworking?coworking_id=${coworkingId}`,
        { headers: getAuthHeaders() }
      );
      setBookings(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке бронирований:', err);
      setError('Не удалось загрузить бронирования');
    }
  }, [getAuthHeaders, coworkingId]);

  const handleModalOk = useCallback(() => {
    setShowModal(false);
    setSelectedWorkspaces([]);
    setSelectedWorkplace(null);
    setBookingStartTime('');
    setBookingEndTime('');
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(
        'https://prod-team-37-ajc3mefd.REDACTED/api/v1/user/profile',
        { headers: getAuthHeaders() }
      );
      setUserProfile(response.data);
      return response.data;
    } catch (err) {
      console.error('Ошибка при загрузке профиля пользователя:', err);
      setError('Не удалось загрузить профиль пользователя');
    }
  }, [getAuthHeaders]);

  const generateQRCodeUrl = useCallback((bookingId, userId) => {
    const baseUrl = 'https://prod-team-37-ajc3mefd.REDACTED/api/v1/bookings/activate';
    const url = `${baseUrl}?booking_id=${bookingId}&user_id=${userId}`;
    setQrCodeUrl(url);
  }, []);

  const handleBooking = useCallback(async () => {
    if (!bookingStartTime || !bookingEndTime) {
      setBookingErrorMessage('Пожалуйста, выберите время начала и окончания бронирования');
      setShowBookingError(true);
      return;
    }

    try {
      const bookingData = {
        workplaces: selectedWorkspaces.map(number => workplaces[number].id),
        start_time: bookingStartTime,
        end_time: bookingEndTime
      };

      const bookingResponse = await axios.post(
        'https://prod-team-37-ajc3mefd.REDACTED/api/v1/bookings/add',
        bookingData,
        { headers: getAuthHeaders() }
      );

      setLastBookingId(bookingResponse.data.id);
      
      const profile = await fetchUserProfile();
      if (profile && bookingResponse.data.id) {
        generateQRCodeUrl(bookingResponse.data.id, profile.id);
      }

      setShowModal(true);
      await fetchBookings();
    } catch (err) {
      if (err.response?.status === 403) {
        setBookingErrorMessage('Выбранное время пересекается с существующим бронированием');
      } else {
        setBookingErrorMessage('Ошибка при бронировании');
      }
      setShowBookingError(true);
      console.error(err);
    }
  }, [selectedWorkspaces, workplaces, getAuthHeaders, bookingStartTime, bookingEndTime, fetchBookings, fetchUserProfile, generateQRCodeUrl]);

  const handleCancelSelection = useCallback((key) => {
    setSelectedWorkspaces(prev => prev.filter(item => item !== key));
  }, []);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    const handleTouchStart = (e) => {
      if (e.target.closest('.workspace-circle')) return;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
      } else if (e.touches.length === 2) {
        e.preventDefault();

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const rect = currentContainer.getBoundingClientRect();
        pinchInitRef.current = {
          distance: initialDistance,
          scale: transform.scale,
          midX: (touch1.clientX + touch2.clientX) / 2 - rect.left,
          midY: (touch1.clientY + touch2.clientY) / 2 - rect.top
        };
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        doDrag(touch.clientX, touch.clientY);
      } else if (e.touches.length === 2 && pinchInitRef.current) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const rect = currentContainer.getBoundingClientRect();

        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        const scaleFactor = currentDistance / pinchInitRef.current.distance;
        const newScale = pinchInitRef.current.scale * scaleFactor;

        const centerX = containerSize.width / 2;
        const centerY = containerSize.height / 2;
        const dx = midX - centerX;
        const dy = midY - centerY;

        const newTranslateX = dx * (1 - scaleFactor) + transform.translateX;
        const newTranslateY = dy * (1 - scaleFactor) + transform.translateY;

        applyTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        });

        pinchInitRef.current = {
          ...pinchInitRef.current,
          distance: currentDistance,
          scale: newScale
        };
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        pinchInitRef.current = null;

        if (e.touches.length === 0) {
          endDrag();
        }
      }
    };

    currentContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    currentContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    currentContainer.addEventListener('touchend', handleTouchEnd);
    currentContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      currentContainer.removeEventListener('touchstart', handleTouchStart);
      currentContainer.removeEventListener('touchmove', handleTouchMove);
      currentContainer.removeEventListener('touchend', handleTouchEnd);
      currentContainer.removeEventListener('wheel', handleWheel);
    };
  }, [transform, applyTransform, handleWheel, startDrag, doDrag, endDrag, containerSize]);

  useEffect(() => {
    updateContainerSize();

    const handleResize = () => {
      updateContainerSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateContainerSize]);

  const fetchCoworkingData = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://prod-team-37-ajc3mefd.REDACTED/api/v1/coworking/${coworkingId}/get`,
        { headers: getAuthHeaders() }
      );
      setCoworkingData(response.data);
    } catch (err) {
      setError('Ошибка при загрузке данных коворкинга');
      console.error(err);
    }
  }, [coworkingId, getAuthHeaders]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login');
      return;
    }
    if (!coworkingId) {
      setError('ID коворкинга не указан');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCoworkingData(),
          fetchTariffs(),
          fetchWorkplaces(),
          fetchBookings()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchCoworkingData, fetchTariffs, fetchWorkplaces, fetchBookings, authLoading, token, coworkingId, navigate]);

  return (
    <div className="workspace-creation-page">
      {loading ? (
        <div className="loading-container">
          <p>Загрузка...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="page-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="page-header-title">
              {coworkingData?.name || 'Бронирование'}
            </h1>
          </div>

          <div className="main-content">
            <div className="workspace-canvas-container">
              <div
                ref={containerRef}
                className={`workspace-canvas ${isDragging ? 'grabbing' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={coworkingData?.photo_url || planImage}
                  alt="План помещения"
                  className="workspace-image"
                  style={{
                    transform: `scale(${transform.scale}) translate(${transform.translateX / transform.scale}px, ${transform.translateY / transform.scale}px)`
                  }}
                  onLoad={handleImageLoad}
                />
                {Object.entries(workplaces).map(([key, workplace]) => {
                  const isSelected = selectedWorkspaces.includes(key);
                  const markerColor = getTariffColor(workplace.tariff);
                  const coords = getWorkspaceCoordinates(workplace);

                  return (
                    <div
                      key={key}
                      className={`workspace-circle ${isSelected ? 'selected' : ''} ${workplace.status === 'BOOKED' ? 'booked' : ''}`}
                      style={{
                        left: `calc(${coords.x}px - ${CIRCLE_SIZE * 1.5}px)`,
                        top: `calc(${coords.y}px - ${CIRCLE_SIZE * 1.5}px)`,
                        width: CIRCLE_SIZE * 3,
                        height: CIRCLE_SIZE * 3,
                        backgroundColor: markerColor,
                        opacity: workplace.status === 'BOOKED' ? 0.5 : 1
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(key);
                      }}
                    >
                      <p className="workspace-circle-number" style={{ fontSize: `${CIRCLE_SIZE * 1.5}px` }}>
                        {key}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="workspace-info-panel">
              <div className="tariffs-list">
                <h3>Тарифы</h3>
                {Object.values(tariffs).map(tariff => (
                  <div key={tariff.id} className="tariff-item" style={{ backgroundColor: tariff.color }}>
                    <span className="tariff-name">{tariff.name}</span>
                    <span className="tariff-price">{tariff.price} ₽/час</span>
                  </div>
                ))}
              </div>

              {selectedWorkspaces.length > 0 && (
                <div className="selected-workspaces">
                  <div className="selected-list">
                    {selectedWorkspaces.map(key => (
                      <div
                        key={key}
                        className="selected-workspace-item"
                        style={{
                          backgroundColor: getTariffColor(workplaces[key].tariff)
                        }}
                      >
                        <span>Место {key}</span>
                        <button onClick={() => handleCancelSelection(key)} className="remove-workspace-button">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="booking-time-selector">
                    <div className="time-input">
                      <label>Начало бронирования:</label>
                      <input
                        type="datetime-local"
                        value={bookingStartTime}
                        onChange={(e) => setBookingStartTime(e.target.value)}
                      />
                    </div>
                    <div className="time-input">
                      <label>Окончание бронирования:</label>
                      <input
                        type="datetime-local"
                        value={bookingEndTime}
                        onChange={(e) => setBookingEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleBooking} 
                    className="book-button"
                    disabled={!bookingStartTime || !bookingEndTime}
                  >
                    Забронировать {selectedWorkspaces.length > 1 ? 'места' : 'место'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {showError && (
            <div className="error-message">
              <p className="error-text">
                Можно забронировать только до 3 мест
              </p>
              <button onClick={() => setShowError(false)} className="error-close-button">
                ×
              </button>
            </div>
          )}

          {showBookingError && (
            <div className="error-message">
              <p>{bookingErrorMessage}</p>
              <button onClick={() => setShowBookingError(false)}>×</button>
            </div>
          )}

          {showModal && (
            <div>
              <div className="modal-overlay" />
              <div className="creation-modal">
                <h2 className="modal-title">Бронирование подтверждено!</h2> 
                <p className="modal-message">
                  Вы успешно забронировали {selectedWorkspaces.length}{' '}
                  {selectedWorkspaces.length > 1 ? 'места' : 'место'}: {selectedWorkspaces.join(', ')}
                </p>
                {qrCodeUrl && (
                  <div className="qr-code-container">
                    <p>Отсканируйте QR-код для активации бронирования:</p>
                    <QRCodeSVG value={qrCodeUrl} size={200} />
                  </div>
                )}
                <button onClick={handleModalOk} className="modal-button">
                  Отлично!
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = `
  .qr-code-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 20px 0;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
  }

  .qr-code-container p {
    margin-bottom: 15px;
    font-size: 16px;
    color: #333;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default UserSpacePage;
