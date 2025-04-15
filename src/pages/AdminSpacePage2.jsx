import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSpacePage.css';

const initialCoordinates = {
  '00': { desc: 'VIP место', value: 'vip', tags: ['window', 'plant'], moneyPerHour: '500', status: 'available', x: '10vw', y: '10vh' },
  '01': { desc: 'Простое место 1', value: 'simple1', tags: ['plant'], moneyPerHour: '300', status: 'available', x: '20vw', y: '20vh' },
};

const AdminSpacePage = ({ isCreating = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState(isCreating ? {} : initialCoordinates);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [mode, setMode] = useState(isCreating ? 'create' : 'view');
  const [tempWorkspace, setTempWorkspace] = useState(null);
  const [editValues, setEditValues] = useState({ desc: '', moneyPerHour: '', tags: [] });
  const [isVertical, setIsVertical] = useState(false);
  const [coworkingName, setCoworkingName] = useState(isCreating ? 'Новый коворкинг' : 'Коворкинг Пространство');

  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth < window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleGoBack = () => {
    navigate('/admin-space');
  };

  const handleWorkspaceClick = (key) => {
    if (selectedWorkspace && selectedWorkspace.key === key) {
      setSelectedWorkspace(null);
    } else {
      setSelectedWorkspace({ ...workspaces[key], key });
    }
  };

  const handleCanvasClick = (event) => {
    const x = (event.clientX / window.innerWidth) * 100 - 20.6;
    const y = (event.clientY / window.innerHeight) * 100 - 22.5;

    if (mode === 'view' || mode === 'create') {
      const isOverlapping = Object.values(workspaces).some(workspace => {
        const dx = parseFloat(workspace.x) - x;
        const dy = parseFloat(workspace.y) - y;
        return Math.sqrt(dx * dx + dy * dy) < 2.5;
      });

      if (!isOverlapping) {
        const newKey = generateNewKey();
        setWorkspaces(prev => ({
          ...prev,
          [newKey]: {
            desc: 'Новое место',
            value: `simple${newKey}`,
            tags: [],
            moneyPerHour: '200',
            status: 'available',
            x: `${x}vw`,
            y: `${y}vh`
          }
        }));
      }
    } else if (mode === 'move' && tempWorkspace) {
      setWorkspaces(prev => {
        const updated = { ...prev };
        const movedWorkspace = { ...updated[tempWorkspace], x: `${x}vw`, y: `${y}vh` };
        const newKey = generateNewKey();
        updated[newKey] = movedWorkspace;
        delete updated[tempWorkspace];
        return updated;
      });
      setTempWorkspace(null);
      setMode('view');
    } else if (mode === 'duplicate' && tempWorkspace) {
      setWorkspaces(prev => {
        const newKey = generateNewKey();
        const { desc, moneyPerHour, tags, status } = prev[tempWorkspace];
        return {
          ...prev,
          [newKey]: {
            desc,
            value: `simple${newKey}`,
            tags,
            moneyPerHour,
            status,
            x: `${x}vw`,
            y: `${y}vh`
          }
        };
      });
    }
  };

  const handleEdit = () => {
    setTempWorkspace(selectedWorkspace.key);
    setEditValues({
      desc: selectedWorkspace.desc,
      moneyPerHour: selectedWorkspace.moneyPerHour,
      tags: selectedWorkspace.tags
    });
    setMode('edit');
    setSelectedWorkspace(null);
  };
  const handleSave = () => {
    setWorkspaces(prev => ({
      ...prev,
      [tempWorkspace]: { ...prev[tempWorkspace], ...editValues }
    }));
    setSelectedWorkspace({ ...workspaces[tempWorkspace], ...editValues, key: tempWorkspace });
    setTempWorkspace(null);
    setMode('view');
  };
  const handleMove = () => {
    setTempWorkspace(selectedWorkspace.key);
    setMode('move');
    setSelectedWorkspace(null);
  };
  const handleDuplicate = () => {
    setTempWorkspace(selectedWorkspace.key);
    setMode('duplicate');
    setSelectedWorkspace(null);
  };

  const generateNewKey = () => {
    const existingKeys = Object.keys(workspaces).map(Number);
    let newKey = 1;
    while (existingKeys.includes(newKey)) {
      newKey++;
    }
    return newKey.toString().padStart(2, '0');
  };
  const handleRightClick = (event, key) => {
    event.preventDefault();
    const newWorkspaces = { ...workspaces };
    delete newWorkspaces[key];
    setWorkspaces(newWorkspaces);
  };

  const handleBack = () => {
    setTempWorkspace(null);
    setMode('view');
    setSelectedWorkspace(null);
  };

  const handleCancel = () => {
    setSelectedWorkspace(null);
  };

  const handleMouseEnter = (e) => {
    e.target.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
  };

  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = '';
  };

  const handleSaveCoworking = () => {
    // Здесь будет логика сохранения коворкинга
    alert('Коворкинг успешно сохранен!');
    navigate('/admin-space');
  };

  const handleCoworkingNameChange = (e) => {
    setCoworkingName(e.target.value);
  };

  return (
    <div className={`workspace-creation-page ${isVertical ? 'vertical' : ''}`}>
      <div className="workspace-header">
        <div className="workspace-title-container">
          <button className="back-arrow" onClick={handleGoBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {isCreating ? (
            <input
              type="text"
              value={coworkingName}
              onChange={handleCoworkingNameChange}
              className="coworking-title-input"
              placeholder="Введите название коворкинга"
            />
          ) : (
            <h1 className="coworking-title">{coworkingName}</h1>
          )}
        </div>
      </div>
      <div className="workspace-canvas" onClick={handleCanvasClick}>
        {Object.entries(workspaces).map(([key, workspace]) => (
          <div
            key={key}
            className={`workspace-circle  ${workspace.value}`}
            style={{ left: workspace.x, top: workspace.y }}
            onClick={() => handleWorkspaceClick(key)}
            onContextMenu={(e) => handleRightClick(e, key)}
          >
            {key}
          </div>
        ))}
      </div>
      <div className="workspace-details">
        {selectedWorkspace ? (
          <>
            <h2>{selectedWorkspace.desc}</h2>
            <p>Стоимость: {selectedWorkspace.moneyPerHour} руб./час</p>
            <p>Статус: {selectedWorkspace.status}</p>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleEdit}>Редактировать это рабочее место</button>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleMove}>Переместить место</button>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleDuplicate}>Дублировать место</button>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleCancel}>Отмена</button>
          </>
        ) : (mode === 'edit' && tempWorkspace) ? (
          <div>
            <h2>Редактировать рабочее место</h2>
            <input
              type="text"
              value={editValues.desc}
              onChange={(e) => setEditValues({ ...editValues, desc: e.target.value })}
              placeholder="Описание"
              className="input-field"
            />
            <input
              type="text"
              value={editValues.moneyPerHour}
              onChange={(e) => setEditValues({ ...editValues, moneyPerHour: e.target.value })}
              placeholder="Стоимость"
              className="input-field"
            />
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleSave}>Сохранить</button>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleBack}>Назад</button>
          </div>
        ) : (mode === 'move' && tempWorkspace) ? (
          <div>
            <h2>Выберите место для перемещения</h2>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleBack}>Назад</button>
          </div>
        ) : (mode === 'duplicate' && tempWorkspace) ? (
          <div>
            <h2>Выберите место, куда дублировать</h2>
            <button onMouseEnter={handleMouseEnter} onMouseOut={handleMouseOut} onClick={handleBack}>Назад</button>
          </div>
        ) : (
          <div>
            <p>Выберите рабочее место для просмотра деталей или кликните на холст, чтобы добавить новое место.</p>
            {isCreating && (
              <button
                className="save-coworking-button"
                onClick={handleSaveCoworking}
                onMouseEnter={handleMouseEnter}
                onMouseOut={handleMouseOut}
              >
                Сохранить коворкинг
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSpacePage;
