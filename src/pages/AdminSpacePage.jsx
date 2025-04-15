import React, { useRef, useState, useEffect } from 'react';
import './AdminSpacePage.css';
import { IoArrowBack } from 'react-icons/io5';
import { FaPlus, FaEdit, FaTrash, FaInfoCircle, FaCheck, FaTimes, FaRedo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CANVAS_HEIGHT = 400;

const AdminSpacePage = () => {
  const canvasRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const [dragMode, setDragMode] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [workspaces, setWorkspaces] = useState({});
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [mode, setMode] = useState('view');
  const [tempWorkspace, setTempWorkspace] = useState(null);
  const [editValues, setEditValues] = useState({
    desc: '',
    moneyPerHour: '',
    value: '',
    tags: [],
    status: ''
  });
  const [editKey, setEditKey] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [bookingInput, setBookingInput] = useState("");
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);
  const [imageHeight, setImageHeight] = useState(null);
  const [isVertical, setIsVertical] = useState(false);
  const [step, setStep] = useState(1);
  const [tariffs, setTariffs] = useState([]);
  const [newTariff, setNewTariff] = useState({
    name: '',
    color: '#6a11cb',
    price_per_hour: ''
  });
  const [showTariffForm, setShowTariffForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [creationStatus, setCreationStatus] = useState('');
  const [creationError, setCreationError] = useState(null);
  const [coworkingData, setCoworkingData] = useState({
    name: 'Новый коворкинг',
    address: '',
    photo_url: '',
    description: ''
  });
  const [createdCoworkingId, setCreatedCoworkingId] = useState(null);
  const [createdTariffIds, setCreatedTariffIds] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [isCreationComplete, setIsCreationComplete] = useState(false);

  const [tariffErrors, setTariffErrors] = useState({
    name: '',
    price_per_hour: ''
  });

  const [stepStatuses, setStepStatuses] = useState({
    1: { status: 'pending', error: null },
    2: { status: 'pending', error: null },
    3: { status: 'pending', error: null },
    4: { status: 'pending', error: null },
    5: { status: 'pending', error: null }
  });

  const navigate = useNavigate();

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setBackgroundImage(imageUrl);
      setImageFile(file);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
      setCoverImageFile(file);
    }
  };

  const handleImageLoad = (e) => {
    const naturalWidth = e.target.naturalWidth;
    const naturalHeight = e.target.naturalHeight;

    let calculatedWidth, calculatedHeight;

    if (naturalWidth > naturalHeight) {
      calculatedWidth = Math.min(window.innerWidth * 0.6, naturalWidth);
      calculatedHeight = (calculatedWidth / naturalWidth) * naturalHeight;
    } else {
      calculatedHeight = Math.min(CANVAS_HEIGHT, naturalHeight);
      calculatedWidth = (calculatedHeight / naturalHeight) * naturalWidth;
    }

    setImageWidth(calculatedWidth);
    setImageHeight(calculatedHeight);
  };

  const handleWorkspaceClick = (key) => {
    if (selectedWorkspace && selectedWorkspace.key === key) {
      setSelectedWorkspace(null);
    } else {
      setSelectedWorkspace({ ...workspaces[key], key });
      setEditValues({
        desc: workspaces[key].desc,
        tariff: workspaces[key].tariff,
        tags: workspaces[key].tags || []
      });
      setEditKey(key);
    }
  };

  const handleCanvasClick = (event) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (isDragging) return;
    if (!backgroundImage || !imageWidth) return;
    if (tariffs.length === 0) return;

    const canvasRect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - canvasRect.left) / canvasRect.width) * 100;
    const y = ((event.clientY - canvasRect.top) / canvasRect.height) * 100;
    const borderMargin = 3;
    const overlapRadius = 3;

    if (x < borderMargin || x > (100 - borderMargin) || y < borderMargin || y > (100 - borderMargin)) {
      return;
    }

    if (mode === 'view') {
      const isOverlapping = Object.values(workspaces).some(workspace => {
        const dx = parseFloat(workspace.x) - x;
        const dy = parseFloat(workspace.y) - y;
        return Math.sqrt(dx * dx + dy * dy) < overlapRadius;
      });

      if (isOverlapping) return;

      const newKey = generateNewKey();
      const defaultTariff = tariffs[0];

      setWorkspaces(prev => ({
        ...prev,
        [newKey]: {
          desc: 'Новое место',
          tariff: defaultTariff.name,
          tags: [],
          status: 'available',
          x: `${x}%`,
          y: `${y}%`
        }
      }));
    } else if (mode === 'move' && tempWorkspace) {
      const isOverlapping = Object.entries(workspaces).some(([key, workspace]) => {
        if (key === tempWorkspace) return false;
        const dx = parseFloat(workspace.x) - x;
        const dy = parseFloat(workspace.y) - y;
        return Math.sqrt(dx * dx + dy * dy) < overlapRadius;
      });
      if (isOverlapping) return;

      setWorkspaces(prev => {
        const updated = { ...prev };
        updated[tempWorkspace] = { ...updated[tempWorkspace], x: `${x}%`, y: `${y}%` };
        return updated;
      });
      setTempWorkspace(null);
      setMode('view');
    } else if (mode === 'duplicate' && tempWorkspace) {
      const isOverlapping = Object.values(workspaces).some(workspace => {
        const dx = parseFloat(workspace.x) - x;
        const dy = parseFloat(workspace.y) - y;
        return Math.sqrt(dx * dx + dy * dy) < overlapRadius;
      });
      if (isOverlapping) return;

      setWorkspaces(prev => {
        const newKey = generateNewKey();
        const { desc, tariff, tags } = prev[tempWorkspace];
        return {
          ...prev,
          [newKey]: {
            desc,
            tariff,
            tags,
            status: 'available',
            x: `${x}%`,
            y: `${y}%`
          }
        };
      });
    }
  };

  const handleEdit = () => {
    setTempWorkspace(selectedWorkspace.key);
    setEditKey(selectedWorkspace.key);
    setEditValues({
      desc: selectedWorkspace.desc,
      moneyPerHour: selectedWorkspace.moneyPerHour,
      value: selectedWorkspace.value,
      tags: selectedWorkspace.tags,
      status: selectedWorkspace.status
    });
    setTagInput("");
    setBookingInput("");
    setMode('edit');
    setSelectedWorkspace(null);
  };

  const handleSave = () => {
    const oldKey = tempWorkspace;
    const newKey = editKey.trim();
    if (newKey === "") return;

    setWorkspaces(prev => {
      let updated = { ...prev };
      if (newKey === oldKey) {
        updated[oldKey] = { ...updated[oldKey], ...editValues };
      } else if (updated[newKey]) {
        const workspaceA = { ...updated[oldKey], ...editValues };
        const workspaceB = { ...updated[newKey] };
        updated[newKey] = workspaceA;
        updated[oldKey] = workspaceB;
      } else {
        updated[newKey] = { ...updated[oldKey], ...editValues };
        delete updated[oldKey];
      }
      return updated;
    });
    setSelectedWorkspace({ ...workspaces[oldKey], ...editValues, key: newKey });
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
    if (selectedWorkspace && selectedWorkspace.key === key) {
      setSelectedWorkspace(null);
    }
    if (tempWorkspace === key) {
      setTempWorkspace(null);
      setMode('view');
    }
  };

  const handleBack = () => {
    setTempWorkspace(null);
    setMode('view');
    setSelectedWorkspace(null);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    setSelectedWorkspace(null);
  };

  const handleMouseEnter = (e) => {
    e.target.style.filter = 'brightness(1.1)';
  };

  const handleMouseOut = (e) => {
    e.target.style.filter = '';
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() !== "" && !editValues.tags.includes(tagInput.trim())) {
      setEditValues({
        ...editValues,
        tags: [...editValues.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const removeTag = (e, tag) => {
    e.preventDefault();
    setEditValues({
      ...editValues,
      tags: editValues.tags.filter(t => t !== tag)
    });
  };

  const handleBooking = () => {
    if (bookingInput.trim() !== "") {
      setEditValues({
        ...editValues,
        status: bookingInput.trim()
      });
      setBookingInput("");
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3);

    const scaleChange = newScale / scale;

    const newOffsetX = (offset.x - mouseX) * scaleChange + mouseX;
    const newOffsetY = (offset.y - mouseY) * scaleChange + mouseY;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
};
useEffect(() => {
    const currentCanvas = canvasRef.current;
    if (currentCanvas) {
        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                currentCanvas.dataset.initialPinchDistance = distance;
                currentCanvas.dataset.initialScale = scale;
            }
        };

        const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
          );
          const initialDistance = parseFloat(currentCanvas.dataset.initialPinchDistance);
          const initialScale = parseFloat(currentCanvas.dataset.initialScale);

          if (initialDistance && initialScale) {
            const scaleFactor = currentDistance / initialDistance;
            const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.5), 3);

            const touchCenter = {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            };
            const rect = currentCanvas.getBoundingClientRect();
            const centerX = touchCenter.x - rect.left;
            const centerY = touchCenter.y - rect.top;
            const scaleChange = newScale - scale;
            const newOffsetX = offset.x - (centerX * scaleChange);
            const newOffsetY = offset.y - (centerY * scaleChange);

            setScale(newScale);
            setOffset({ x: newOffsetX, y: newOffsetY });
          }
        } else if (e.touches.length === 1) {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = currentCanvas.getBoundingClientRect();
          const dx = touch.clientX - rect.left;
          const dy = touch.clientY - rect.top;

          setOffset(prevOffset => ({
            x: prevOffset.x + (dx - (rect.width / 2)),
            y: prevOffset.y + (dy - (rect.height / 2))
          }));
        }
      };

      const handleTouchEnd = (e) => {
        if (e.touches.length === 0) {
          currentCanvas.dataset.initialPinchDistance = null;
          currentCanvas.dataset.initialScale = null;
        }
      };

      const handleWheel = (e) => {
        e.preventDefault();
        const rect = currentCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 3);

        const scaleFactor = newScale / scale;
        const newOffsetX = offset.x - (mouseX * (scaleFactor - 1));
        const newOffsetY = offset.y - (mouseY * (scaleFactor - 1));

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
      };

      currentCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      currentCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      currentCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      currentCanvas.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        currentCanvas.removeEventListener('touchstart', handleTouchStart);
        currentCanvas.removeEventListener('touchmove', handleTouchMove);
        currentCanvas.removeEventListener('touchend', handleTouchEnd);
        currentCanvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [canvasRef, scale, offset]);

  const handleMouseDown = (event) => {
  event.preventDefault();
  setLastMousePos({ x: event.clientX, y: event.clientY });
  hasDraggedRef.current = false;
  const workspaceCircle = event.target.closest('.workspace-circle');
  if (workspaceCircle) {
    event.stopPropagation();
    const key = workspaceCircle.dataset.key;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;
    const workspace = workspaces[key];
    const workspaceX = (parseFloat(workspace.x) / 100) * canvasRect.width;
    const workspaceY = (parseFloat(workspace.y) / 100) * canvasRect.height;
    setDragOffset({ x: mouseX - workspaceX, y: mouseY - workspaceY });
    setDragMode('workspace');
    setTempWorkspace(key);

    setTimeout(() => {
      if (!hasDraggedRef.current) {
        handleWorkspaceClick(key);
      }
    }, 400);
  } else {
    setDragMode('background');
  }
  setIsDragging(true);
};

  const handleMouseMove = (event) => {
    if (!isDragging) return;

    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;

    if (dragMode === 'workspace' && tempWorkspace && workspaces[tempWorkspace] && dragOffset !== null) {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - canvasRect.left;
    const mouseY = event.clientY - canvasRect.top;

    let newX = ((mouseX - dragOffset.x) / canvasRect.width) * 100;
    let newY = ((mouseY - dragOffset.y) / canvasRect.height) * 100;

    const borderMargin = 3;
    newX = Math.max(borderMargin, Math.min(newX, 100 - borderMargin));
    newY = Math.max(borderMargin, Math.min(newY, 100 - borderMargin));

    setWorkspaces(prev => ({
      ...prev,
      [tempWorkspace]: {
      ...prev[tempWorkspace],
      x: `${newX}%`,
      y: `${newY}%`
      }
    }));
    } else if (dragMode === 'background') {
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true;
    }
    setOffset(prevOffset => ({
      x: prevOffset.x + dx*2,
      y: prevOffset.y + dy*2
    }));
    }

    setLastMousePos({ x: event.clientX, y: event.clientY });
  };


  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
    setDragOffset(null);
  };

  const validateTariff = (tariff) => {
    const errors = {
      name: '',
      price_per_hour: ''
    };

    if (!tariff.name.trim()) {
      errors.name = 'Название тарифа обязательно';
    }

    const price = parseFloat(tariff.price_per_hour);
    if (!tariff.price_per_hour) {
      errors.price_per_hour = 'Цена обязательна';
    } else if (isNaN(price)) {
      errors.price_per_hour = 'Цена должна быть числом';
    } else if (price <= 0) {
      errors.price_per_hour = 'Цена должна быть больше 0';
    } else if (!Number.isInteger(price)) {
      errors.price_per_hour = 'Цена должна быть целым числом';
    } else if (tariff.price_per_hour.startsWith('0') && tariff.price_per_hour.length > 1) {
      errors.price_per_hour = 'Цена не может начинаться с нуля';
    }

    setTariffErrors(errors);
    return !errors.name && !errors.price_per_hour;
  };

  const handleAddTariff = () => {
    if (!validateTariff(newTariff)) {
      return;
    }

    setTariffs([...tariffs, { ...newTariff }]);
    setNewTariff({
      name: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      price_per_hour: ''
    });
    setTariffErrors({
      name: '',
      price_per_hour: ''
    });
    setShowTariffForm(false);

    if (tariffs.length === 0) {
      setStep(3);
    }
  };

  const handleDeleteTariff = (index) => {
    const tariffName = tariffs[index].name;
    const isUsed = Object.values(workspaces).some(workspace => workspace.tariff === tariffName);
    if (isUsed) {
      alert('Нельзя удалить тариф, который используется рабочими местами');
      return;
    }
    const newTariffs = [...tariffs];
    newTariffs.splice(index, 1);
    setTariffs(newTariffs);
  };

  const handleChangeTariff = (tariffName) => {
    setEditValues({
      ...editValues,
      tariff: tariffName
    });

    if (selectedWorkspace) {
      setWorkspaces(prev => ({
        ...prev,
        [selectedWorkspace.key]: {
          ...prev[selectedWorkspace.key],
          tariff: tariffName
        }
      }));
    }
  };

  const getTariffColor = (tariffName) => {
    const tariff = tariffs.find(t => t.name === tariffName);
    return tariff ? tariff.color : '#cccccc';
  };

  const getTariffPrice = (tariffName) => {
    const tariff = tariffs.find(t => t.name === tariffName);
    return tariff ? tariff.price_per_hour : '0';
  };

  const handleDescChange = (value) => {
    setEditValues(prev => ({ ...prev, desc: value }));

    if (selectedWorkspace) {
      setWorkspaces(prev => ({
        ...prev,
        [selectedWorkspace.key]: {
          ...prev[selectedWorkspace.key],
          desc: value
        }
      }));
    }
  };

  const handleCoworkingDataChange = (field, value) => {
    setCoworkingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCoworkingData = () => {
    if (!coworkingData.name.trim()) {
      alert('Пожалуйста, введите название коворкинга');
      return false;
    }
    if (!coworkingData.address.trim()) {
      alert('Пожалуйста, введите адрес коворкинга');
      return false;
    }
    if (!coworkingData.description.trim()) {
      alert('Пожалуйста, введите описание коворкинга');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!coworkingData.name.trim()) {
      alert('Пожалуйста, введите название коворкинга');
      return;
    }
    if (!coworkingData.address.trim()) {
      alert('Пожалуйста, введите адрес коворкинга');
      return;
    }
    if (!coworkingData.description.trim()) {
      alert('Пожалуйста, введите описание коворкинга');
      return;
    }
    if (!backgroundImage) {
      alert('Пожалуйста, загрузите план коворкинга');
      return;
    }
    setStep(2);
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadImageToCDN = async (file) => {
    try {
      if (!file) {
        throw new Error('Изображение не выбрано');
      }

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Не найден токен авторизации');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://prod-team-37-ajc3mefd.REDACTED/api/v1/cdn/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки изображения: ${response.status}`);
      }

      const data = await response.json();
      return `https://prod-team-37-ajc3mefd.REDACTED${data.path}`;
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      setCreationError(error.message);
      throw error;
    }
  };

  const createCoworking = async (photoUrl, coverUrl) => {
    try {
      setCreationStatus('Создание коворкинга...');

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Не найден токен авторизации');
      }

      const response = await fetch('https://prod-team-37-ajc3mefd.REDACTED/api/v1/coworking/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: coworkingData.name,
          address: coworkingData.address || 'Адрес не указан',
          cover_url: coverUrl,
          photo_url: photoUrl,
          description: coworkingData.description || 'Описание отсутствует'
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка создания коворкинга: ${response.status}`);
      }

      const data = await response.json();
      setCreatedCoworkingId(data.id);
      return data.id;
    } catch (error) {
      console.error('Ошибка при создании коворкинга:', error);
      setCreationError(error.message);
      throw error;
    }
  };

  const updateStepStatus = (step, status, error = null) => {
    setStepStatuses(prev => ({
      ...prev,
      [step]: { status, error }
    }));
  };

  const resetStepStatuses = () => {
    setStepStatuses({
      1: { status: 'pending', error: null },
      2: { status: 'pending', error: null },
      3: { status: 'pending', error: null },
      4: { status: 'pending', error: null },
      5: { status: 'pending', error: null }
    });
  };

  const retryStep = async (step) => {
    try {
      updateStepStatus(step, 'loading');

      switch(step) {
        case 1:
          const [photoUrl, coverUrl] = await Promise.all([
            uploadImageToCDN(imageFile),
            uploadImageToCDN(coverImageFile)
          ]);
          updateStepStatus(step, 'completed');
          return { photoUrl, coverUrl };

        case 2:
          const coworkingId = await createCoworking(lastUploadedUrls.photoUrl, lastUploadedUrls.coverUrl);
          updateStepStatus(step, 'completed');
          return coworkingId;

        case 3:
          const tariffIdMap = await createTariffs(createdCoworkingId);
          updateStepStatus(step, 'completed');
          return tariffIdMap;

        case 4:
          await createWorkplaces(createdCoworkingId, createdTariffIds);
          updateStepStatus(step, 'completed');
          break;

        default:
          break;
      }
    } catch (error) {
      updateStepStatus(step, 'error', error.message);
      throw error;
    }
  };

  const [lastUploadedUrls, setLastUploadedUrls] = useState({ photoUrl: null, coverUrl: null });

  const handleCreateCoworking = async () => {
    if (!imageFile) {
      alert('Необходимо загрузить изображение плана коворкинга');
      return;
    }

    if (!coverImageFile) {
      alert('Необходимо загрузить изображение обложки коворкинга');
      return;
    }

    if (!coworkingData.name.trim()) {
      alert('Необходимо указать название коворкинга');
      return;
    }

    if (tariffs.length === 0) {
      alert('Необходимо создать хотя бы один тариф');
      return;
    }

    if (Object.keys(workspaces).length === 0) {
      alert('Необходимо создать хотя бы одно рабочее место');
      return;
    }

    setIsCreating(true);
    setCreationStep(1);
    setCreationError(null);
    setIsCreationComplete(false);
    resetStepStatuses();

    try {
      // Шаг 1: Загрузка изображений
      setCreationStep(1);
      updateStepStatus(1, 'loading');
      const [photoUrl, coverUrl] = await Promise.all([
        uploadImageToCDN(imageFile),
        uploadImageToCDN(coverImageFile)
      ]);
      setLastUploadedUrls({ photoUrl, coverUrl });
      updateStepStatus(1, 'completed');

      // Шаг 2: Создание коворкинга
      setCreationStep(2);
      updateStepStatus(2, 'loading');
      const coworkingId = await createCoworking(photoUrl, coverUrl);
      updateStepStatus(2, 'completed');

      // Шаг 3: Создание тарифов
      setCreationStep(3);
      updateStepStatus(3, 'loading');
      const tariffIdMap = await createTariffs(coworkingId);
      updateStepStatus(3, 'completed');

      // Шаг 4: Создание рабочих мест
      setCreationStep(4);
      updateStepStatus(4, 'loading');
      await createWorkplaces(coworkingId, tariffIdMap);
      updateStepStatus(4, 'completed');

      // Завершение
      setCreationStep(5);
      updateStepStatus(5, 'completed');
      setIsCreationComplete(true);
    } catch (error) {
      console.error('Ошибка при создании коворкинга:', error);
      setCreationError(error.message);
      updateStepStatus(creationStep, 'error', error.message);
    }
  };

  const createTariffs = async (coworkingId) => {
    try {
      setCreationStatus('Создание тарифов...');

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Не найден токен авторизации');
      }

      if (tariffs.length === 0) {
        throw new Error('Не созданы тарифы');
      }

      const tariffsData = tariffs.map(tariff => ({
        coworking_id: coworkingId,
        name: tariff.name,
        color: tariff.color,
        price_per_hour: parseFloat(tariff.price_per_hour)
      }));
      const response = await fetch('https://prod-team-37-ajc3mefd.REDACTED/api/v1/coworking/tariffs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(tariffsData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка создания тарифов: ${response.status}`);
      }

      const data = await response.json();

      const tariffIdMap = {};
      data.forEach((createdTariff, index) => {
        tariffIdMap[tariffs[index].name] = createdTariff.id;
      });

      setCreatedTariffIds(tariffIdMap);
      return tariffIdMap;
    } catch (error) {
      console.error('Ошибка при создании тарифов:', error);
      setCreationError(error.message);
      throw error;
    }
  };

  const createWorkplaces = async (coworkingId, tariffIdMap) => {
    try {
      setCreationStatus('Создание рабочих мест...');

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Не найден токен авторизации');
      }

      if (Object.keys(workspaces).length === 0) {
        throw new Error('Не созданы рабочие места');
      }

      const workplacesData = Object.entries(workspaces).map(([key, workspace]) => {
        const tariffId = tariffIdMap[workspace.tariff];
        if (!tariffId) {
          throw new Error(`Не найден ID для тарифа ${workspace.tariff}`);
        }

        let x, y;
        try {
          const xStr = workspace.x.toString();
          const yStr = workspace.y.toString();
          x = parseFloat(xStr.replace('%', ''));
          y = parseFloat(yStr.replace('%', ''));
          if (isNaN(x) || isNaN(y)) {
            throw new Error(`Некорректные координаты для места ${key}`);
          }
        } catch (error) {
          console.error(`Ошибка при обработке координат для места ${key}:, error`);
          x = Math.random() * 100;
          y = Math.random() * 100;
        }

        return {
          coworking_id: coworkingId,
          tariff_id: tariffId,
          number: parseInt(key, 10) || Math.floor(Math.random() * 1000),
          name: workspace.desc || `Место ${key}`,
          tags: workspace.tags || [],
          x_cor: x,
          y_cor: y
        };
      });

      const response = await fetch('https://prod-team-37-ajc3mefd.REDACTED/api/v1/workplace/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(workplacesData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка создания рабочих мест: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка при создании рабочих мест:', error);
      setCreationError(error.message);
      throw error;
    }
  };

  const handleDeleteWorkspace = () => {
    if (!selectedWorkspace) return;
    const key = selectedWorkspace.key;
    setWorkspaces(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setSelectedWorkspace(null);
    if (tempWorkspace === key) {
      setTempWorkspace(null);
      setMode('view');
    }
  };

  const handleCloseModal = () => {
    if (isCreationComplete) {
      navigate('/admin-panel');
    }
  };

  return (
    <div className='workspace-creation-page'>
      <div className="page-header">
        <button className="back-arrow" onClick={handleGoBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.8333 10H4.16666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.16666 15L4.16666 10L9.16666 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="coworking-title">
          Создание коворкинга
        </h1>
      </div>

      <div className="steps-container">
        {/* Шаг 1: Загрузка плана */}
        <div className="step-block">
          <div className="step-header">
            <div className="step-number">1</div>
            <h2>Загрузка плана коворкинга</h2>
          </div>

          <div className="step-content">
            <p className="step-description">Заполните информацию о коворкинге и добавьте изображение плана</p>
            <div className="form-group">
              <label>Название коворкинга:</label>
              <input
                type="text"
                className="input-field"
                value={coworkingData.name}
                onChange={(e) => handleCoworkingDataChange('name', e.target.value)}
                placeholder="Введите название коворкинга"
                required
              />
            </div>

            <div className="form-group">
              <label>Адрес:</label>
              <input
                type="text"
                className="input-field"
                value={coworkingData.address}
                onChange={(e) => handleCoworkingDataChange('address', e.target.value)}
                placeholder="Введите адрес коворкинга"
                required
              />
            </div>

            <div className="form-group">
              <label>Описание:</label>
              <textarea
                className="input-field"
                value={coworkingData.description}
                onChange={(e) => handleCoworkingDataChange('description', e.target.value)}
                placeholder="Введите описание коворкинга"
                rows={3}
                required
              />
            </div>
            <div className="image-upload-section">
              <h3>Обложка коворкинга</h3>
              <div className="image-picker">
                <label className="custom-file-upload">
                  <FaPlus /> {coverImage ? "Изменить обложку" : "Загрузить обложку"}
                  <input type="file" accept="image/*" onChange={handleCoverImageChange} />
                </label>
              </div>

              {coverImage && (
                <div className="image-preview">
                  <img
                    src={coverImage}
                    alt="Предпросмотр обложки"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}

              <h3>План коворкинга</h3>
              <div className="image-picker">
                <label className="custom-file-upload">
                  <FaPlus /> {backgroundImage ? "Изменить план" : "Загрузить план"}
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>

              {backgroundImage && (
                <div className="image-preview">
                  <img
                    src={backgroundImage}
                    alt="Предпросмотр плана"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    onLoad={handleImageLoad}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Шаг 2: Создание тарифов */}
        <div className={`step-block ${!backgroundImage ? 'disabled' : ''}`}>
          <div className="step-header">
            <div className="step-number">2</div>
            <h2>Создание тарифов</h2>
          </div>

          <div className="step-content">
            <p className="step-description">Создайте тарифы для рабочих мест в вашем коворкинге</p>

            {backgroundImage && (
              <div className="tariffs-container">
                {tariffs.map((tariff, index) => (
                  <div key={index} className="tariff-card" style={{borderLeft: `4px solid ${tariff.color}`}}>
                    <div className="tariff-info">
                      <h3>{tariff.name}</h3>
                      <p>{tariff.price_per_hour} ₽/час</p>
                    </div>
                    <button
                      className="delete-tariff-btn"
                      onClick={() => handleDeleteTariff(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {showTariffForm ? (
                  <div className="tariff-form">
                    <div className="form-group">
                      <input
                        type="text"
                        className={`input-field ${tariffErrors.name ? 'error' : ''}`}
                        placeholder="Название тарифа"
                        value={newTariff.name}
                        onChange={(e) => setNewTariff({...newTariff, name: e.target.value})}
                      />
                      {tariffErrors.name && <span className="error-message">{tariffErrors.name}</span>}
                    </div>
                    <div className="color-picker-container">
                      <label>Цвет:</label>
                      <input
                        type="color"
                        value={newTariff.color}
                        onChange={(e) => setNewTariff({...newTariff, color: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="number"
                        className={`input-field ${tariffErrors.price_per_hour ? 'error' : ''}`}
                        placeholder="Цена за час (₽)"
                        value={newTariff.price_per_hour}
                        onChange={(e) => setNewTariff({...newTariff, price_per_hour: e.target.value})}
                      />
                      {tariffErrors.price_per_hour && <span className="error-message">{tariffErrors.price_per_hour}</span>}
                    </div>
                    <div className="tariff-form-buttons">
                      <button onClick={handleAddTariff}>Сохранить</button>
                      <button className="cancel-btn" onClick={() => {
                        setShowTariffForm(false);
                        setTariffErrors({ name: '', price_per_hour: '' });
                      }}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <button className="add-tariff-btn" onClick={() => setShowTariffForm(true)}>
                    <FaPlus /> Добавить тариф
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Шаг 3: Размещение рабочих мест */}
        <div className={`step-block ${!backgroundImage || tariffs.length === 0 ? 'disabled' : ''}`}>
          <div className="step-header">
            <div className="step-number">3</div>
            <h2>Размещение рабочих мест</h2>
          </div>

          <div className="step-content">
            {backgroundImage && tariffs.length > 0 ? (
              <div className="main-content">
                {showInstructions && (
                  <div className="instructions-panel">
                    <div className="instructions-header">
                      <h3>Инструкция по работе</h3>
                      <button className="close-instructions" onClick={() => setShowInstructions(false)}>×</button>
                    </div>
                    <ul>
                      <li>Нажмите на план коворкинга, чтобы добавить новое рабочее место</li>
                      <li>Выберите тариф для каждого рабочего места</li>
                      <li>Для перемещения по плану используйте колесико мыши для масштабирования</li>
                      <li>Удерживайте левую кнопку мыши для перемещения плана</li>
                      <li>Перетаскивайте рабочие места, удерживая левую кнопку мыши</li>
                      <li>Нажмите правой кнопкой мыши по месту для его удаления</li>
                      <li>Нажмите на рабочее место для просмотра и редактирования его параметров</li>
                      <li>Добавьте описание и теги для каждого рабочего места</li>
                    </ul>
                  </div>
                )}

                {!showInstructions && (
                  <button className="show-instructions-btn" onClick={() => setShowInstructions(true)}>
                    <FaInfoCircle /> Инструкция
                  </button>
                )}

                <div className="workspace-canvas-container" style={{minHeight:'650px'}}>
                  <div className="workspace-canvas-scroll">
                    <div
                      ref={canvasRef}
                      className="workspace-canvas"
                      style={{
                        height: imageHeight ? `${imageHeight}px` : 'auto',
                        width: imageWidth ? `${imageWidth}px` : 'auto',
                        overflow: 'hidden',
                        position: 'relative',
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                      }}
                      onClick={handleCanvasClick}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        src={backgroundImage}
                        alt="План коворкинга"
                        onLoad={handleImageLoad}
                        style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block' }}
                      />
                      {Object.entries(workspaces).map(([key, workspace]) => {
                        const circleColor = getTariffColor(workspace.tariff);
                        const CIRCLE_SIZE = Math.min(imageWidth, imageHeight) * 0.02;
                        return (
                          <div
                            key={key}
                            className="workspace-circle"
                            data-key={key}
                            style={{
                              left: workspace.x,
                              top: workspace.y,
                              backgroundColor: circleColor,
                              position: 'absolute',
                              cursor: 'pointer',
                              width: '10px',
                              height: '10px' ,
                              borderRadius: '50%',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWorkspaceClick(key);
                            }}
                            onContextMenu={(e) => handleRightClick(e, key)}
                          >
                            <p style={{ fontSize: `10px`, color: 'white' }}>{key}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="workspace-details">
                    {selectedWorkspace ? (
                      <div className="workspace-edit-panel">
                        <h2>Место #{selectedWorkspace.key}</h2>

                        <div className="form-group">
                          <label>Описание:</label>
                          <input
                            type="text"
                            value={editValues.desc}
                            onChange={(e) => handleDescChange(e.target.value)}
                            placeholder="Описание места"
                            className="input-field"
                          />
                        </div>

                        <div className="form-group">
                          <label>Тариф:</label>
                          <div className="tariff-selector">
                            {tariffs.map((tariff, index) => (
                              <div
                                key={index}
                                className={`tariff-option ${editValues.tariff === tariff.name ? 'selected' : ''}`}
                                style={{ backgroundColor: tariff.color }}
                                onClick={() => handleChangeTariff(tariff.name)}
                              >
                                {tariff.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Теги:</label>
                          <div className="tags-input">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              placeholder="Новый тег"
                              className="input-field"
                              onKeyPress={(e) => e.key === 'Enter' && addTag(e)}
                            />
                            <button onClick={addTag}>Добавить</button>
                          </div>
                          <div className="tags-list">
                            {editValues.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="tag-badge"
                                onClick={(e) => removeTag(e, tag)}
                                title="Нажмите для удаления"
                              >
                                {tag} ×
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="workspace-info">
                          <div className="info-row">
                            <span className="info-label">Стоимость:</span>
                            <span className="info-value">{getTariffPrice(editValues.tariff)} ₽/час</span>
                          </div>
                        </div>

                        <div className="workspace-actions">
                          <button onClick={handleMove}>Переместить</button>
                          <button onClick={handleDuplicate}>Дублировать</button>

                          <button className="delete-btn" onClick={handleDeleteWorkspace}><FaTrash /> Удалить</button>
                          <button className="cancel-btn" onClick={handleCancel}>Закрыть</button>
                        </div>
                      </div>
                    ) : mode === 'move' && tempWorkspace ? (
                      <div className="workspace-action-info">
                        <h2>Перемещение места #{tempWorkspace}</h2>
                        <p>Выберите новое место на плане</p>
                        <button onClick={handleBack}>Отмена</button>
                      </div>
                    ) : mode === 'duplicate' && tempWorkspace ? (
                      <div className="workspace-action-info">
                        <h2>Дублирование места #{tempWorkspace}</h2>
                        <p>Выберите место для нового рабочего места</p>
                        <button onClick={handleBack}>Отмена</button>
                      </div>
                    ) : (
                      <div className="workspace-empty-state">
                        <p>Выберите рабочее место или нажмите на план, чтобы добавить новое</p>
                        {tariffs.length > 0 && (
                          <div className="tariffs-summary">
                            <h3>Доступные тарифы:</h3>
                            <div className="tariffs-list">
                              {tariffs.map((tariff, index) => (
                                <div key={index} className="tariff-badge" style={{ backgroundColor: tariff.color }}>
                                  {tariff.name}: {tariff.price_per_hour} ₽/час
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="step-description">
                {!backgroundImage
                  ? "Сначала загрузите план коворкинга"
                  : "Создайте хотя бы один тариф для размещения рабочих мест"}
              </p>
            )}
          </div>
        </div>
      </div>

      {backgroundImage && tariffs.length > 0 && Object.keys(workspaces).length > 0 && (
        <div className="create-coworking-container">
          <button className="create-coworking-btn" onClick={handleCreateCoworking}>
            Создать коворкинг
          </button>
        </div>
      )}

      {isCreating && (
        <div className="modal-overlay">
          <div className="creation-modal">
            <div className="modal-content">
              <h2>Создание коворкинга</h2>
              <div className="creation-steps">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`creation-step ${creationStep === step ? 'active' : ''} ${
                      stepStatuses[step].status === 'completed' ? 'completed' :
                      stepStatuses[step].status === 'error' ? 'error' : ''
                    }`}
                  >
                    <div className="step-indicator">
                      {stepStatuses[step].status === 'completed' ? (
                        <FaCheck />
                      ) : stepStatuses[step].status === 'error' ? (
                        <FaTimes />
                      ) : stepStatuses[step].status === 'loading' ? (
                        <div className="loading-spinner" />
                      ) : (
                        step
                      )}
                    </div>
                    <div className="step-info">
                      <h3>
                        {step === 1 && 'Загрузка изображений'}
                        {step === 2 && 'Создание коворкинга'}
                        {step === 3 && 'Создание тарифов'}
                        {step === 4 && 'Создание рабочих мест'}
                      </h3>
                      {stepStatuses[step].error && (
                        <div className="step-error">
                          <p>{stepStatuses[step].error}</p>
                          <button onClick={() => retryStep(step)} className="retry-button">
                            <FaRedo /> Повторить
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {creationError && !isCreationComplete && (
                <div className="creation-error">
                  <FaTimes className="error-icon" />
                  <h3>Произошла ошибка</h3>
                  <p>{creationError}</p>
                  <button onClick={() => retryStep(creationStep)}>
                    <FaRedo /> Повторить
                  </button>
                </div>
              )}

              {isCreationComplete && (
                <div className="creation-complete">
                  <FaCheck className="success-icon" />
                  <h3>Коворкинг успешно создан!</h3>
                  <p>Все данные успешно сохранены</p>
                  <button onClick={() => {
                    setIsCreating(false);
                    navigate('/admin-panel');
                  }}>
                    Перейти к списку коворкингов
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpacePage;
