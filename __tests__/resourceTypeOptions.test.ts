import { RESOURCE_TYPE_OPTIONS, type ResourceType } from '../app/resourceTypeOptions';

describe('resource type options', () => {
  it('includes equipment and material radio options', () => {
    expect(RESOURCE_TYPE_OPTIONS).toEqual([
      { label: 'Equipment', value: 'equipment' },
      { label: 'Material', value: 'material' },
    ]);

    const values = RESOURCE_TYPE_OPTIONS.map((option) => option.value);
    expect(values).toContain<ResourceType>('equipment');
    expect(values).toContain<ResourceType>('material');
  });
});
