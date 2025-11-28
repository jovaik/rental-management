
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  Calendar, 
  Wrench, 
  BarChart3, 
  FileText, 
  Settings,
  Bell,
  Home,
  Euro
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Vehículos', href: '/vehicles', icon: Car },
  { name: 'Mantenimiento', href: '/maintenance', icon: Wrench },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Gastos', href: '/expenses', icon: Euro },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
];

export default function TestNavPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Navegación</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {navigation?.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-2">
                  <Icon className="h-8 w-8 mx-auto text-blue-600" />
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600">
                    Ir a {item.name.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Enlaces Directos:</h2>
        <ul className="space-y-2">
          {navigation?.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className="text-blue-600 hover:underline"
              >
                {item.name} - {item.href}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
