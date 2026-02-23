import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';

export default function AdminLessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => learningEndpoints.getModules(courseId!),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Módulos e Aulas</h1>
      <pre className="rounded-xl bg-muted p-4 text-xs overflow-auto">
        {JSON.stringify(modules, null, 2)}
      </pre>
    </div>
  );
}
