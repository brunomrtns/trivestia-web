/** Gera path relativo dentro do tenant: /t/{slug}/{path} */
export function tenantPath(slug: string, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/t/${slug}${clean}`;
}
