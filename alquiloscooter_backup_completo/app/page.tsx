
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    // Si es propietario, redirigir directamente a comisiones
    if (session.user?.role === 'propietario') {
      redirect('/comisiones');
    } else {
      redirect('/dashboard');
    }
  } else {
    redirect('/login');
  }
}
