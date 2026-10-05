import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getRelatedTools, getTool, tools } from '@/lib/tools';

describe('tool registry', () => {
  it('exposes 26 unique tools', () => {
    expect(tools).toHaveLength(26);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(26);
  });

  it('gives every tool a category, accent, and use cases', () => {
    for (const tool of tools) {
      expect(tool.category).toBeTruthy();
      expect(['vermilion', 'cobalt', 'olive']).toContain(tool.accent);
      expect(tool.useCases.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('ships an illustration for every tool', () => {
    for (const tool of tools) {
      const asset = join(process.cwd(), 'public', 'tools', `${tool.slug}.svg`);
      expect(existsSync(asset)).toBe(true);
    }
  });

  it('looks tools up by slug', () => {
    expect(getTool('merge')?.name).toBe('Merge PDFs');
    expect(getTool('does-not-exist')).toBeUndefined();
  });

  it('returns related tools that exclude the current one', () => {
    const related = getRelatedTools('merge', 4);
    expect(related).toHaveLength(4);
    expect(related.some((tool) => tool.slug === 'merge')).toBe(false);
  });
});
