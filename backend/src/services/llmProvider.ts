// Mock LLM provider abstraction. Implementations must return a JSON-like object.
export interface LLMProvider {
  extractIntent(text: string): Promise<any>;
}

// Safe mock implementation used for tests and initial integration.
export class MockLLMProvider implements LLMProvider {
  async extractIntent(text: string) {
    // Very small heuristic-based mock: looks for numbers and categories
    const lower = text.toLowerCase();
    const match = text.match(/\b(under|below|less than)\s*(\d+[.,]?\d*)/i);
    let budgetPaise: number | undefined;
    if (match) {
      const raw = match[2].replace(/[,]/g, '');
      const rupees = Math.round(parseFloat(raw) * 100);
      if (!Number.isNaN(rupees)) budgetPaise = rupees;
    }

    const categories = ['headphones', 'laptop', 'phone', 'monitor'];
    const category = categories.find((c) => lower.includes(c));

    return {
      // Note: This output is untrusted and must be validated by caller
      category: category || null,
      budgetPaise: budgetPaise || null,
      raw: text,
    };
  }
}
