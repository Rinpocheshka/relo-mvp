import { RouterProvider } from 'react-router';
import { router } from './routes';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';

export default function App() {
  return (
    <SupabaseAuthProvider>
      <RouterProvider router={router} />
    </SupabaseAuthProvider>
  )
}
