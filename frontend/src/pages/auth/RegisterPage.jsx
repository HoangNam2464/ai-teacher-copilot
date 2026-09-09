import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  const { t } = useTranslation();
  return (
    <Card className="shadow-2xl border border-white/50 dark:border-gray-800 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl">
      <CardHeader className="space-y-6 pb-6">
        <div className="flex flex-col items-center space-y-3">
          {/* Logo */}
          <Link to="/" className="group cursor-pointer mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
              <BrainCircuit className="w-9 h-9 text-white" />
            </div>
          </Link>

          <div className="text-center space-y-1.5">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('auth.register')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('auth.registerSubtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
