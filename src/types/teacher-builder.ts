export interface TeacherBuilderConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeType: string;
  clothes: string;
  clothesColor: string;
  accessories: string;
}

export const SKIN_TONES = [
  { label: 'Muito Clara', value: '#fcdcb8' },
  { label: 'Clara', value: '#e2ba93' },
  { label: 'Média', value: '#c7956a' },
  { label: 'Escura', value: '#8a522a' },
  { label: 'Muito Escura', value: '#4f2b11' },
];

export const HAIR_STYLES = [
  { label: 'Curto', value: 'short' },
  { label: 'Médio', value: 'medium' },
  { label: 'Longo', value: 'long' },
  { label: 'Careca', value: 'bald' },
];

export const HAIR_COLORS = [
  { label: 'Preto', value: '#0f0f0f' },
  { label: 'Castanho Escuro', value: '#3b2513' },
  { label: 'Castanho Claro', value: '#754b2b' },
  { label: 'Loiro', value: '#e6c863' },
  { label: 'Ruivo', value: '#a63311' },
  { label: 'Grisalho', value: '#a3a3a3' },
];

export const EYE_TYPES = [
  { label: 'Redondo', value: 'round' },
  { label: 'Amendoado', value: 'almond' },
  { label: 'Puxado', value: 'narrow' },
];

export const CLOTHES_OPTIONS = [
  { label: 'Camiseta', value: 'tshirt' },
  { label: 'Camisa', value: 'shirt' },
  { label: 'Blazer', value: 'blazer' },
];

export const CLOTHES_COLORS = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Preto', value: '#171717' },
  { label: 'Branco', value: '#f8fafc' },
  { label: 'Roxo', value: '#a855f7' },
];

export const ACCESSORY_OPTIONS = [
  { label: 'Nenhum', value: 'none' },
  { label: 'Óculos', value: 'glasses' },
  { label: 'Brincos', value: 'earrings' },
];

export const DEFAULT_BUILDER_CONFIG: TeacherBuilderConfig = {
  skinTone: SKIN_TONES[2].value,
  hairStyle: 'short',
  hairColor: HAIR_COLORS[1].value,
  eyeType: 'round',
  clothes: 'tshirt',
  clothesColor: CLOTHES_COLORS[0].value,
  accessories: 'none',
};
