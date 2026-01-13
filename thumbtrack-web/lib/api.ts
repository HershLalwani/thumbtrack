import { AuthResponse, Pin, PinsResponse, User, ApiError, Board, BoardsResponse, BoardSummary, Comment, CommentsResponse, UsersResponse, BoardMember, TagCount } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).error || 'Something went wrong');
    }

    return data as T;
  }

  // Auth endpoints
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // User profile endpoints
  async getUserProfile(username: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/users/${username}`);
  }

  async getUserPinsByUsername(username: string, page = 1, limit = 20): Promise<PinsResponse> {
    return this.request<PinsResponse>(`/users/${username}/pins?page=${page}&limit=${limit}`);
  }

  async getUserBoards(username: string, page = 1, limit = 20): Promise<BoardsResponse> {
    return this.request<BoardsResponse>(`/users/${username}/boards?page=${page}&limit=${limit}`);
  }

  // Pin endpoints
  async getPins(page = 1, limit = 20): Promise<PinsResponse> {
    return this.request<PinsResponse>(`/pins?page=${page}&limit=${limit}`);
  }

  async getPin(id: string): Promise<{ pin: Pin }> {
    return this.request<{ pin: Pin }>(`/pins/${id}`);
  }

  async updatePin(id: string, data: { title?: string; description?: string; imageUrl?: string; link?: string | null; tags?: string[] }): Promise<{ pin: Pin }> {
    return this.request<{ pin: Pin }>(`/pins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePin(id: string): Promise<void> {
    await this.request<void>(`/pins/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserPins(userId: string, page = 1, limit = 20): Promise<PinsResponse> {
    return this.request<PinsResponse>(`/pins/user/${userId}?page=${page}&limit=${limit}`);
  }

  // Board endpoints
  async getBoard(id: string): Promise<{ board: Board }> {
    return this.request<{ board: Board }>(`/boards/${id}`);
  }

  async getBoardPins(boardId: string, page = 1, limit = 20): Promise<PinsResponse> {
    return this.request<PinsResponse>(`/boards/${boardId}/pins?page=${page}&limit=${limit}`);
  }

  async createBoard(data: { name: string; description?: string; isPrivate?: boolean }): Promise<{ board: Board }> {
    return this.request<{ board: Board }>('/boards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(id: string, data: { name?: string; description?: string | null; isPrivate?: boolean }): Promise<{ board: Board }> {
    return this.request<{ board: Board }>(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(id: string): Promise<void> {
    await this.request<void>(`/boards/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyBoards(): Promise<{ boards: BoardSummary[] }> {
    return this.request<{ boards: BoardSummary[] }>('/boards/my/boards');
  }

  async savePinToBoard(boardId: string, pinId: string): Promise<void> {
    await this.request<void>(`/boards/${boardId}/pins`, {
      method: 'POST',
      body: JSON.stringify({ pinId }),
    });
  }

  async removePinFromBoard(boardId: string, pinId: string): Promise<void> {
    await this.request<void>(`/boards/${boardId}/pins/${pinId}`, {
      method: 'DELETE',
    });
  }

  // Board member endpoints
  async getBoardMembers(boardId: string): Promise<{ owner: any; members: BoardMember[] }> {
    return this.request<{ owner: any; members: BoardMember[] }>(`/boards/${boardId}/members`);
  }

  async addBoardMember(boardId: string, username: string, role: 'ADMIN' | 'CONTRIBUTOR' = 'CONTRIBUTOR'): Promise<{ member: BoardMember }> {
    return this.request<{ member: BoardMember }>(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    });
  }

  async updateBoardMemberRole(boardId: string, memberId: string, role: 'ADMIN' | 'CONTRIBUTOR'): Promise<{ member: BoardMember }> {
    return this.request<{ member: BoardMember }>(`/boards/${boardId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeBoardMember(boardId: string, memberId: string): Promise<void> {
    await this.request<void>(`/boards/${boardId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async leaveBoard(boardId: string): Promise<void> {
    await this.request<void>(`/boards/${boardId}/leave`, {
      method: 'DELETE',
    });
  }

  // Follow endpoints
  async followUser(username: string): Promise<void> {
    await this.request<void>(`/users/${username}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(username: string): Promise<void> {
    await this.request<void>(`/users/${username}/follow`, {
      method: 'DELETE',
    });
  }

  async checkFollowing(username: string): Promise<{ isFollowing: boolean }> {
    return this.request<{ isFollowing: boolean }>(`/users/${username}/following`);
  }

  async getFollowers(username: string, page = 1, limit = 20): Promise<UsersResponse> {
    return this.request<UsersResponse>(`/users/${username}/followers?page=${page}&limit=${limit}`);
  }

  async getFollowing(username: string, page = 1, limit = 20): Promise<UsersResponse> {
    return this.request<UsersResponse>(`/users/${username}/following-list?page=${page}&limit=${limit}`);
  }

  // Comment endpoints
  async getComments(pinId: string, page = 1, limit = 20): Promise<CommentsResponse> {
    return this.request<CommentsResponse>(`/comments/pin/${pinId}?page=${page}&limit=${limit}`);
  }

  async createComment(pinId: string, content: string): Promise<{ comment: Comment }> {
    return this.request<{ comment: Comment }>(`/comments/pin/${pinId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async updateComment(commentId: string, content: string): Promise<{ comment: Comment }> {
    return this.request<{ comment: Comment }>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Search endpoints
  async search(query: string, options?: { tags?: string[]; page?: number; limit?: number }): Promise<PinsResponse> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (options?.tags?.length) params.set('tags', options.tags.join(','));
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    return this.request<PinsResponse>(`/search?${params.toString()}`);
  }

  async getSearchSuggestions(query: string): Promise<{ suggestions: string[] }> {
    return this.request<{ suggestions: string[] }>(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getPopularTags(): Promise<{ tags: TagCount[] }> {
    return this.request<{ tags: TagCount[] }>('/search/tags/popular');
  }

  async getPinsByTag(tag: string, page = 1, limit = 20): Promise<PinsResponse & { tag: string }> {
    return this.request<PinsResponse & { tag: string }>(`/search/tags/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`);
  }

  // Recommendation endpoints
  async getForYouFeed(): Promise<{ pins: Pin[] }> {
    return this.request<{ pins: Pin[] }>('/recommendations/for-you');
  }

  async getTrendingPins(): Promise<{ pins: Pin[] }> {
    return this.request<{ pins: Pin[] }>('/recommendations/trending');
  }

  async getFollowingFeed(): Promise<{ pins: Pin[] }> {
    return this.request<{ pins: Pin[] }>('/recommendations/following');
  }

  async recordPinView(pinId: string): Promise<void> {
    await this.request<void>(`/recommendations/view/${pinId}`, {
      method: 'POST',
    });
  }

  // Create pin with tags
  async createPin(data: { title: string; description?: string; imageUrl: string; link?: string; tags?: string[] }): Promise<{ pin: Pin }> {
    return this.request<{ pin: Pin }>('/pins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Upload endpoints
  async getUploadStatus(): Promise<{ configured: boolean; message: string }> {
    return this.request<{ configured: boolean; message: string }>('/uploads/status');
  }

  async getPresignedUploadUrl(contentType: string): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    return this.request<{ uploadUrl: string; key: string; publicUrl: string }>('/uploads/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    });
  }

  /**
   * Upload image to R2 with automatic WebP conversion
   * @param file - The image file to upload
   * @returns Object with publicUrl and conversion stats
   */
  async uploadImageToR2(file: File): Promise<{
    publicUrl: string;
    width: number;
    height: number;
    originalSize: number;
    convertedSize: number;
    compressionRatio: string;
  }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
  }
}

export const api = new ApiClient();
