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
    // Ne pas logger les erreurs 404 pour les endpoints qui n'existent pas encore (comme ingredients)
    if (response.status === 404 && endpoint.includes('/ingredients')) {
      // Retourner un tableau vide silencieusement pour ingredients
      return [];
    }
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body?.message) detail = body.message;
      else if (body?.error) detail = body.error;
    } catch {
      // ignorer si le corps n'est pas du JSON
    }
    throw new Error(`API Error: ${response.status} ${detail}`);
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
  update: (id: string, data: any) => fetchAPI(`/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
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

// ========== BATCH STEPS API ==========

export const batchStepsAPI = {
  update: (id: string, data: any) =>
    fetchAPI(`/batch-steps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ========== INGREDIENTS API ==========

export const ingredientsAPI = {
  getAll: () => fetchAPI('/ingredients'),
  getById: (id: string) => fetchAPI(`/ingredients/${id}`),
  create: (data: { name: string; code?: string; description?: string; category?: string; unit: string }) => fetchAPI('/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI(`/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI(`/ingredients/${id}`, {
    method: 'DELETE',
  }),
};

// ========== MANUAL WEIGHTS (Balance manuel) API ==========

export const manualWeightsAPI = {
  getAll: (product?: string) => {
    const query = product ? `?product=${encodeURIComponent(product)}` : '';
    return fetchAPI(`/manual-weights${query}`);
  },
  save: (entries: Array<{ productName: string; weight: number; sequence: number }>) =>
    fetchAPI('/manual-weights', {
      method: 'POST',
      body: JSON.stringify({
        entries: entries.map((e) => ({ productName: e.productName, weight: e.weight, sequence: e.sequence })),
      }),
    }),
};

// ========== AUTOMATE VARIABLES API ==========

export const automateAPI = {
  writeVariable: (variable: string, value: any = true, utilisateur?: string) =>
    fetchAPI('/variable', {
      method: 'POST',
      body: JSON.stringify({
        variable,
        value,
        utilisateur: utilisateur || 'supervision_web',
      }),
    }),
};

// ========== USERS API ==========

export const usersAPI = {
  getAll: () => fetchAPI('/users'),
  getById: (id: string) => fetchAPI(`/users/${id}`),
  create: (data: { username: string; email: string; password: string; role: string; mixerGroup?: string | null }) =>
    fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),
  changePassword: (id: string, password: string) =>
    fetchAPI(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),
};

// ========== AUTH API ==========

export const authAPI = {
  login: (username: string, password: string) =>
    fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
};

