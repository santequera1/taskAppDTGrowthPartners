const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Cargar tokens del localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si el token expiró, intentar refrescar
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Reintentar la petición original
          (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            return { error: retryData.error || 'Error en la petición' };
          }
          return { data: retryData };
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Error en la petición' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'Error de conexión' };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ==================== AUTH ====================

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const result = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    if (result.data) {
      this.setTokens(result.data.accessToken, result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data) {
      this.setTokens(result.data.accessToken, result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async firebaseLogin(idToken: string) {
    const result = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/firebase/login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (result.data) {
      this.setTokens(result.data.accessToken, result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async firebaseRegister(idToken: string, firstName?: string, lastName?: string) {
    const result = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/firebase/register', {
      method: 'POST',
      body: JSON.stringify({ idToken, firstName, lastName }),
    });

    if (result.data) {
      this.setTokens(result.data.accessToken, result.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  // ==================== TASKS ====================

  async getTasks(filters?: { projectId?: number; columnId?: number; status?: string; priority?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', String(filters.projectId));
    if (filters?.columnId) params.append('columnId', String(filters.columnId));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/tasks${query}`);
  }

  async getTask(id: number) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(task: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    position?: number;
    color?: string;
    images?: string[];
    columnId?: number;
    projectId?: number;
    userId?: number;
  }) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, task: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    position: number;
    color: string;
    images: string[];
    columnId: number | null;
    projectId: number | null;
    userId: number | null;
  }>) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: number) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async addComment(taskId: number, content: string) {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async updateTaskPositions(tasks: { id: number; position: number; columnId?: number }[]) {
    return this.request('/tasks/batch/positions', {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    });
  }

  // ==================== PROJECTS ====================

  async getProjects() {
    return this.request('/projects');
  }

  async getProject(id: number) {
    return this.request(`/projects/${id}`);
  }

  async createProject(project: { name: string; description?: string; color?: string }) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, project: Partial<{ name: string; description: string; color: string }>) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: number) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== COLUMNS ====================

  async getColumns(projectId?: number) {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/columns${query}`);
  }

  async getColumn(id: number) {
    return this.request(`/columns/${id}`);
  }

  async createColumn(column: { name: string; position?: number; color?: string; projectId?: number }) {
    return this.request('/columns', {
      method: 'POST',
      body: JSON.stringify(column),
    });
  }

  async updateColumn(id: number, column: Partial<{ name: string; position: number; color: string; projectId: number | null }>) {
    return this.request(`/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(column),
    });
  }

  async deleteColumn(id: number) {
    return this.request(`/columns/${id}`, {
      method: 'DELETE',
    });
  }

  async updateColumnPositions(columns: { id: number; position: number }[]) {
    return this.request('/columns/batch/positions', {
      method: 'PUT',
      body: JSON.stringify({ columns }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
