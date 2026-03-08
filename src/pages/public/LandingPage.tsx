import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  BarChart3,
  Trophy,
  Layers,
  CheckCircle2,
  Star
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { authStorage } from '@/features/auth/storage';

export default function LandingPage() {
  const { isAuthenticated, tenantSlug } = useAuthStore();
  const { t } = useTranslation();
  const slug = tenantSlug ?? authStorage.getLastTenantSlug();

  const features = [
    {
      icon: Layers,
      title: t('public.landing.features.structured.title'),
      description: t('public.landing.features.structured.description')
    },
    {
      icon: CheckCircle2,
      title: t('public.landing.features.activities.title'),
      description: t('public.landing.features.activities.description')
    },
    {
      icon: BarChart3,
      title: t('public.landing.features.progress.title'),
      description: t('public.landing.features.progress.description')
    },
    {
      icon: Trophy,
      title: t('public.landing.features.trading.title'),
      description: t('public.landing.features.trading.description')
    }
  ];

  const stats = [
    { label: t('public.landing.stats.activeStudents'), value: '2.400+' },
    { label: t('public.landing.stats.contentHours'), value: '120+' },
    { label: t('public.landing.stats.completionRate'), value: '87%' },
    { label: t('public.landing.stats.avgScore'), value: '4.9', icon: Star }
  ];

  // Aluno/admin autenticado vai direto para o dashboard
  if (isAuthenticated && slug) {
    return <Navigate to={`/t/${slug}/app/dashboard`} replace />;
  }

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-24 lg:py-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('public.landing.badge')}
            </span>
            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight lg:text-7xl">
              Invista no seu{' '}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                conhecimento
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
              {t('public.landing.subtitle')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:shadow-xl"
              >
                {t('common.actions.login')}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/create-school"
                className="rounded-xl border px-8 py-3.5 text-base font-semibold transition-colors hover:bg-accent"
              >
                {t('public.landing.createSchool')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold text-primary">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">
              {t('public.landing.featuresSection.title')}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t('public.landing.featuresSection.subtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="rounded-3xl bg-primary p-12 text-center text-primary-foreground shadow-2xl shadow-primary/30">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              {t('public.landing.cta.title')}
            </h2>
            <p className="mb-8 text-lg opacity-90">
              {t('public.landing.cta.subtitle')}
            </p>
            <Link
              to={slug ? `/t/${slug}/register` : '/login'}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary shadow-lg transition-all hover:scale-105"
            >
              {t('public.landing.cta.button')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
