import { useEffect, useState } from 'react';

const useTelegramWebApp = () => {
  const [tg, setTg] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const webApp = window.Telegram.WebApp;
      setTg(webApp);
      webApp.ready();
      setIsReady(true);

      // Проверяем, является ли устройство мобильным
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Если это не мобильное устройство, входим в полноэкранный режим
      if (!isMobile) {
        webApp.requestFullscreen();
        webApp.setHeaderColor('#ffffff');
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return { tg, isReady };
};

export default useTelegramWebApp; 