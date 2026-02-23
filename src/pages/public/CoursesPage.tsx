import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Layers } from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6">
      <div className="mb-4 h-12 w-12 rounded-xl bg-muted" />
      <div className="mb-2 h-5 w-3/4 rounded-md bg-muted" />
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="mt-4 h-4 w-1/2 rounded-md bg-muted" />
    </div>
  );
}

export default function CoursesPage() {
  // GET /courses — público
  const {
    data: courses,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['courses'],
    queryFn: learningEndpoints.getCourses
  });

  return (
    <div className="container py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold">Cursos disponíveis</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore nossa grade e encontre o curso ideal para você.
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          Não foi possível carregar os cursos. Tente novamente.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          : courses?.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mb-2 text-lg font-bold group-hover:text-primary transition-colors">
                    {course.title}
                  </h2>
                  <p className="flex-1 text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      {course.modules?.length ?? 0} módulos
                    </span>
                    <span className="flex items-center gap-1 font-medium text-primary">
                      Ver curso
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}

        {!isLoading && !isError && courses?.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            Nenhum curso disponível ainda.
          </div>
        )}
      </div>
    </div>
  );
}
