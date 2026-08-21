import { MockLLMProvider } from './llmProvider';

export interface IntentIR {
  // minimal fields justified by orchestrator/design and Phase 2 scope
  category?: string | null;
  maxBudgetPaise?: number | null;
  productQuery?: string | null;
}

const llm = new MockLLMProvider();

function validateIntent(raw: any): IntentIR {
  if (typeof raw !== 'object' || raw === null) {
    const err: any = new Error('Invalid LLM output: expected object');
    err.status = 502;
    throw err;
  }

  const intent: IntentIR = {};

  if ('category' in raw) {
    if (raw.category === null) intent.category = null;
    else if (typeof raw.category === 'string' && raw.category.length <= 100) intent.category = raw.category;
    else {
      const err: any = new Error('Invalid field `category` from LLM');
      err.status = 502;
      throw err;
    }
  }

  if ('budgetPaise' in raw || 'budget' in raw) {
    const val = raw.budgetPaise ?? raw.budget;
    if (typeof val === 'undefined') {
      // treat as absent
    } else if (val === null) intent.maxBudgetPaise = null;
    else if (Number.isInteger(val) && val >= 0) intent.maxBudgetPaise = val;
    else if (typeof val === 'string') {
      // accept numeric strings representing paise (integer) or rupees with up to 2 decimals
      const digitsOnly = /^[0-9]+$/;
      const rupeeFloat = /^[0-9]+(\.[0-9]+)?$/;
      if (digitsOnly.test(val)) {
        intent.maxBudgetPaise = parseInt(val, 10);
      } else if (rupeeFloat.test(val)) {
        const rupees = parseFloat(val);
        const paise = Math.round(rupees * 100);
        if (Number.isInteger(paise)) intent.maxBudgetPaise = paise;
        else {
          const err: any = new Error('Invalid budget string: cannot convert to paise');
          err.status = 400;
          throw err;
        }
      } else {
        const err: any = new Error('Invalid budget: must be integer paise or rupee amount');
        err.status = 400;
        throw err;
      }
    } else if (typeof val === 'number') {
      // accept numeric rupee amounts if they convert to integer paise (<=2 decimals)
      const paise = Math.round(val * 100);
      if (Number.isInteger(paise) && paise >= 0) intent.maxBudgetPaise = paise;
      else {
        const err: any = new Error('Invalid budget: must be integer paise or rupee amount with up to 2 decimals');
        err.status = 400;
        throw err;
      }
    } else {
      const err: any = new Error('Invalid budget: must be integer paise');
      err.status = 400;
      throw err;
    }
  }

  if ('raw' in raw && typeof raw.raw === 'string') {
    // use raw text as productQuery fallback
    intent.productQuery = raw.raw.substring(0, 1000);
  }

  return intent;
}

export async function parseIntent(text: string): Promise<IntentIR> {
  // call LLM abstraction
  const llmOutput = await llm.extractIntent(text);

  // Never trust LLM output — validate thoroughly
  const intent = validateIntent(llmOutput);

  return intent;
}
