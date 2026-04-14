import { RouterProvider } from 'react-router';
import { router } from './routes';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';
import { MessageModalProvider } from './hooks/useMessageModal';

export default function App() {
  return (
    <SupabaseAuthProvider>
      <MessageModalProvider>
        <RouterProvider router={router} />
      </MessageModalProvider>
    </SupabaseAuthProvider>
  )
}
