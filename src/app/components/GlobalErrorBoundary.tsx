import { useRouteError, isRouteErrorResponse } from 'react-router';

export function GlobalErrorBoundary() {
  const error = useRouteError();
  
  // If Vite fails to fetch a dynamic module (e.g., after a new deploy), reload parsing the new chunks.
  if (error instanceof TypeError && error.message.includes('fetch dynamically imported module')) {
    window.location.reload();
    return <div className="min-h-screen bg-warm-milk flex items-center justify-center p-4">Обновление приложения...</div>;
  }

  const errorMessage = isRouteErrorResponse(error) 
    ? `${error.status} ${error.statusText}`
    : error instanceof Error 
      ? error.message 
      : 'Неизвестная ошибка';

  return (
    <div className="min-h-screen bg-warm-milk flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[24px] max-w-md w-full shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-terracotta-deep">Что-то пошло не так 😔</h2>
        <p className="text-muted-foreground mb-6">Эта страница временно недоступна, либо возникла непредвиденная ошибка.</p>
        
        <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm font-mono mb-6 break-words">
          {errorMessage}
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-dusty-indigo text-white rounded-full hover:bg-dusty-indigo/90 transition-colors"
        >
          Обновить страницу
        </button>
      </div>
    </div>
  );
}
