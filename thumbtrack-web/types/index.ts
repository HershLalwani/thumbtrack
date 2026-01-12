export interface User {
  id: string;
  email?: string;
  username: string;
  avatarUrl: string | null;
  bio?: string | null;
  createdAt: string;
  _count?: {
    pins: number;
    boards: number;
    followers: number;
    following: number;
  };
}

export interface UserSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio?: string | null;
}

export interface Pin {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  link: string | null;
  tags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Comment {
  id: string;
  content: string;
  pinId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  pinCount: number;
  coverImages?: string[];
  isGroupBoard?: boolean;
  members?: BoardMember[];
  user?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface BoardMember {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: 'ADMIN' | 'CONTRIBUTOR';
  joinedAt?: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  isPrivate: boolean;
  pinCount: number;
  isOwner?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  pagination: Pagination;
}

export interface PinsResponse extends PaginatedResponse<Pin> {
  pins: Pin[];
}

export interface BoardsResponse extends PaginatedResponse<Board> {
  boards: Board[];
}

export interface CommentsResponse extends PaginatedResponse<Comment> {
  comments: Comment[];
}

export interface UsersResponse extends PaginatedResponse<UserSummary> {
  users: UserSummary[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
  details?: any;
}
