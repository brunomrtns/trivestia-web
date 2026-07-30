import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { TeacherProfileBadge } from '@/components/teacher/TeacherProfileBadge';
import { TeacherBuilderPanel } from '@/components/teacher/TeacherBuilderPanel';
import type { TeacherBuilderConfig } from '@/types/teacher-builder';
import { DEFAULT_BUILDER_CONFIG } from '@/types/teacher-builder';

const TeacherProfileSchema = z.object({
  name: z.string().min(2, 'Nome do professor deve ter pelo menos 2 caracteres'),
  primaryImageUrl: z.string().optional(),
  referenceImagesText: z.string().optional(),
  visualConfigText: z.string().optional()
});

type TeacherProfileForm = z.infer<typeof TeacherProfileSchema>;

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

export default function AdminCourseTeacherProfilePage() {
  const { tenantSlug, courseId } = useParams<{ tenantSlug: string; courseId: string }>();
  const slug = tenantSlug ?? '';
  const id = courseId ?? '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dados' | 'aparência'>('dados');
  const [builderConfig, setBuilderConfig] = useState<TeacherBuilderConfig>(DEFAULT_BUILDER_CONFIG);

  const { data: course } = useQuery({
    queryKey: ['course', slug, id],
    queryFn: () => learningEndpoints.getCourse(slug, id),
    enabled: Boolean(slug && id)
  });

  const { data: teacherProfile, isLoading } = useQuery({
    queryKey: ['teacher-profile', slug, id],
    queryFn: () => adminEndpoints.getTeacherProfile(slug, id),
    enabled: Boolean(slug && id)
  });

  const defaultValues = useMemo<TeacherProfileForm>(() => {
    return {
      name: teacherProfile?.name ?? '',
      primaryImageUrl: teacherProfile?.primaryImageUrl ?? '',
      referenceImagesText: (teacherProfile?.referenceImages ?? []).join('\n'),
      visualConfigText: safeStringify(teacherProfile?.visualConfig ?? {})
    };
  }, [teacherProfile]);

  useEffect(() => {
    if (teacherProfile?.visualConfig) {
      const vc = teacherProfile.visualConfig as Record<string, unknown>;
      if (typeof vc.skinTone === 'string' || typeof vc.hairStyle === 'string') {
        const str = (v: unknown, fallback: string): string =>
          typeof v === 'string' ? v : fallback;
        setBuilderConfig({
          skinTone: str(vc.skinTone, DEFAULT_BUILDER_CONFIG.skinTone),
          hairStyle: str(vc.hairStyle, DEFAULT_BUILDER_CONFIG.hairStyle),
          hairColor: str(vc.hairColor, DEFAULT_BUILDER_CONFIG.hairColor),
          eyeType: str(vc.eyeType, DEFAULT_BUILDER_CONFIG.eyeType),
          clothes: str(vc.clothes, DEFAULT_BUILDER_CONFIG.clothes),
          clothesColor: str(vc.clothesColor, DEFAULT_BUILDER_CONFIG.clothesColor),
          accessories: str(vc.accessories, DEFAULT_BUILDER_CONFIG.accessories),
        });
      }
    }
  }, [teacherProfile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<TeacherProfileForm>({
    resolver: zodResolver(TeacherProfileSchema),
    defaultValues
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const upsertMutation = useMutation({
    mutationFn: async (values: TeacherProfileForm) => {
      let visualConfig: Record<string, unknown> = {};
      const rawVisual = values.visualConfigText?.trim();

      if (rawVisual) {
        const parsed = JSON.parse(rawVisual) as unknown;
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('visualConfig deve ser um objeto JSON válido.');
        }
        visualConfig = parsed as Record<string, unknown>;
      }

      // Merge builderConfig into visualConfig
      visualConfig = { ...visualConfig, ...builderConfig };

      const referenceImages = (values.referenceImagesText ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      return adminEndpoints.upsertTeacherProfile(slug, id, {
        name: values.name.trim(),
        primaryImageUrl: values.primaryImageUrl?.trim() || null,
        referenceImages,
        visualConfig
      });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile', slug, id] });
      queryClient.invalidateQueries({ queryKey: ['course', slug, id] });
      queryClient.invalidateQueries({ queryKey: ['courses', slug] });
      queryClient.invalidateQueries({ queryKey: ['course-interactive', slug, id] });
      toast.success('Professor virtual salvo com sucesso.');
      reset({
        name: saved.name,
        primaryImageUrl: saved.primaryImageUrl ?? '',
        referenceImagesText: (saved.referenceImages ?? []).join('\n'),
        visualConfigText: safeStringify(saved.visualConfig ?? {})
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o professor virtual.';
      toast.error(message);
    }
  });

  const previewTeacher = {
    id: teacherProfile?.id ?? 'preview',
    name: watch('name')?.trim() || 'Professor virtual',
    primaryImageUrl: watch('primaryImageUrl')?.trim() || null,
    referenceImages: (watch('referenceImagesText') ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            to={`/t/${slug}/admin/courses`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para cursos
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">Professor virtual do curso</h1>
          <p className="text-sm text-muted-foreground">
            {course?.title ?? 'Curso'} · Configure o perfil que será exibido no learning.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/t/${slug}/admin/courses/${id}/lessons`)}
          className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-accent"
        >
          Gerenciar aulas
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex space-x-1 rounded-xl bg-muted p-1">
            <button
              onClick={() => setActiveTab('dados')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                activeTab === 'dados'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              Dados Básicos
            </button>
            <button
              onClick={() => setActiveTab('aparência')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                activeTab === 'aparência'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              Aparência do Professor
            </button>
          </div>

          {activeTab === 'dados' ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <form
                onSubmit={handleSubmit((values) => upsertMutation.mutate(values))}
                className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome do professor</label>
                  <input
                    {...register('name')}
                    placeholder="Ex.: Prof. Ana Carvalho"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Imagem principal (URL)</label>
                  <input
                    {...register('primaryImageUrl')}
                    placeholder="https://... ou /uploads/..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Imagens de referência (1 por linha)</label>
                  <textarea
                    {...register('referenceImagesText')}
                    rows={4}
                    placeholder="https://...\nhttps://..."
                    className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">visualConfig (JSON)</label>
                  <textarea
                    {...register('visualConfigText')}
                    rows={10}
                    placeholder='{"skinTone":"medium","hairStyle":"short"}'
                    className="w-full resize-y rounded-lg border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    type="submit"
                    disabled={upsertMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {upsertMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar professor virtual
                  </button>
                </div>
              </form>

              <aside className="space-y-3">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preview
                  </p>
                  <TeacherProfileBadge
                    teacherProfile={previewTeacher}
                    label="Seu professor"
                    variant="card"
                  />
                </div>

                <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
                  Se o curso não tiver professor configurado, o produto esconde o bloco de professor automaticamente.
                </div>
              </aside>
            </div>
          ) : (
            <div className="space-y-6">
              <TeacherBuilderPanel 
                config={builderConfig} 
                onChange={setBuilderConfig} 
              />
              
              <div className="flex justify-end border-t pt-6">
                <button
                  type="button"
                  onClick={() => handleSubmit((values) => upsertMutation.mutate(values))()}
                  disabled={upsertMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Aparência
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
