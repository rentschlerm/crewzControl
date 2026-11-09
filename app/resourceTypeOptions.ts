export type ResourceType = 'equipment' | 'material';

export const RESOURCE_TYPE_OPTIONS = [
  { label: 'Equipment', value: 'equipment' },
  { label: 'Material', value: 'material' },
] as const;
