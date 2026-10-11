import axe from 'axe-core';

export async function axeViolations(element: Element): Promise<axe.Result[]> {
  const result = await axe.run(element, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  return result.violations;
}

export function describeViolations(violations: axe.Result[]): string {
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join('\n');
}
