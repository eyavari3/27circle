import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirect to the new login page
  redirect('/login');
}