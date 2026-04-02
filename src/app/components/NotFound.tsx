import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-terracotta-deep/20 mb-4">404</div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Страница не найдена</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          К сожалению, запрашиваемая страница не существует. Возможно, она была перемещена или удалена.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/home">
            <Button 
              size="lg"
              className="bg-terracotta-deep hover:bg-terracotta-deep/90 text-white rounded-[12px]"
            >
              <Home className="w-5 h-5 mr-2" />
              <span>На главную</span>
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
            className="rounded-[12px]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Назад</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
