export function toLearningOverview(slug: string, courseId: string): string {
  return `/t/${slug}/app/learn/${courseId}`;
}

export function toLearningLesson(
  slug: string,
  courseId: string,
  lessonId: string
): string {
  return `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}`;
}

export function toLearningStep(
  slug: string,
  courseId: string,
  lessonId: string,
  stepId: string
): string {
  return `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}/steps/${stepId}`;
}

export function toLearningActivity(
  slug: string,
  courseId: string,
  lessonId: string,
  stepId: string,
  activityId: string
): string {
  return `/t/${slug}/app/learn/${courseId}/lessons/${lessonId}/steps/${stepId}/activities/${activityId}`;
}

export function toLearningCompletion(slug: string, courseId: string): string {
  return `/t/${slug}/app/learn/${courseId}/complete`;
}

export function toLegacyInteractive(
  slug: string,
  courseId: string
): string {
  return `/t/${slug}/app/courses/${courseId}/interactive`;
}

export function toDashboard(slug: string): string {
  return `/t/${slug}/app/dashboard`;
}
