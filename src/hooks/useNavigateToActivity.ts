import { useNavigate } from 'react-router-dom';

/**
 * Navega sempre para o player padrão (DEFAULT).
 * Sem cache, sem fetch, sem LAB.
 */
export function useNavigateToActivity() {
  const navigate = useNavigate();

  return (activityId: string) => {
    navigate(`/app/activity/${activityId}`);
  };
}
