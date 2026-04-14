import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: GlobalErrorBoundary,
    children: [
      { index: true, lazy: () => import('./components/LandingPage').then(m => ({ Component: m.LandingPage })) },
      { path: 'home', lazy: () => import('./components/HomePage').then(m => ({ Component: m.HomePage })) },
      { path: 'announcements', lazy: () => import('./components/Announcements').then(m => ({ Component: m.Announcements })) },
      { path: 'events', lazy: () => import('./components/Events').then(m => ({ Component: m.Events })) },
      { path: 'support', lazy: () => import('./components/FindSupport').then(m => ({ Component: m.FindSupport })) },
      { path: 'people', lazy: () => import('./components/PeopleNearby').then(m => ({ Component: m.PeopleNearby })) },
      { path: 'map', lazy: () => import('./components/MapPage').then(m => ({ Component: m.MapPage })) },
      { path: 'profile', lazy: () => import('./components/Profile').then(m => ({ Component: m.Profile })) },
      { path: 'profile/:id', lazy: () => import('./components/Profile').then(m => ({ Component: m.Profile })) },
      { path: 'messages', lazy: () => import('./components/MessagesPage').then(m => ({ Component: m.MessagesPage })) },
      { path: 'messages/:chatId', lazy: () => import('./components/ChatRoom').then(m => ({ Component: m.ChatRoom })) },
      { path: '*', lazy: () => import('./components/NotFound').then(m => ({ Component: m.NotFound })) },
    ],
  },
]);
