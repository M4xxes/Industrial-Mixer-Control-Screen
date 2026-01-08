const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Transform object keys from snake_case to camelCase
function transformKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  // Handle Date objects and other special types
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;
  
  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(obj[key]);
    }
  }
  return transformed;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return transformKeys(data);
}

// ========== MIXERS API ==========

export const mixersAPI = {
  getAll: () => fetchAPI('/mixers'),
  getById: (id: number) => fetchAPI(`/mixers/${id}`),
  update: (id: number, data: any) => fetchAPI(`/mixers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  startRecipe: (id: number, data: { recipe_id: string; operator_id?: string; batch_number?: string }) => 
    fetchAPI(`/mixers/${id}/start-recipe`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  endRecipe: (id: number) => fetchAPI(`/mixers/${id}/end-recipe`, {
    method: 'POST',
  }),
  validateStep: (id: number, stepNumber: number) => fetchAPI(`/mixers/${id}/validate-step`, {
    method: 'POST',
    body: JSON.stringify({ step_number: stepNumber }),
  }),
};

// ========== RECIPES API ==========

export const recipesAPI = {
  getAll: () => fetchAPI('/recipes'),
  getById: (id: string) => fetchAPI(`/recipes/${id}`),
  create: (data: any) => fetchAPI('/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/recipes/${id}`, {
    method: 'DELETE',
  }),
};

// ========== INVENTORY API ==========

export const inventoryAPI = {
  getAll: () => fetchAPI('/inventory'),
  update: (id: string, data: any) => fetchAPI(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ========== ALARMS API ==========

export const alarmsAPI = {
  getAll: () => fetchAPI('/alarms'),
  acknowledge: (id: string, operatorId?: string) => fetchAPI(`/alarms/${id}/acknowledge`, {
    method: 'PUT',
    body: JSON.stringify({ operator_id: operatorId || 'admin' }),
  }),
};

// ========== BATCHES API ==========

export const batchesAPI = {
  getAll: () => fetchAPI('/batches'),
  getById: (id: string) => fetchAPI(`/batches/${id}`),
};

// ========== DEFAUTS CATALOGUE API ==========

export const defautsAPI = {
  getAll: (filters?: { automate?: string; code?: string }) => {
    const params = new URLSearchParams();
    if (filters?.automate) params.append('automate', filters.automate);
    if (filters?.code) params.append('code', filters.code);
    const query = params.toString();
    return fetchAPI(`/defauts${query ? `?${query}` : ''}`);
  },
  getById: (id: number) => fetchAPI(`/defauts/${id}`),
};

// ========== ETAPES EXECUTION API ==========

export const etapesExecutionAPI = {
  getAll: (cycleId?: string) => {
    const query = cycleId ? `?cycle_id=${cycleId}` : '';
    return fetchAPI(`/etapes-execution${query}`);
  },
  create: (data: any) => fetchAPI('/etapes-execution', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI(`/etapes-execution/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

