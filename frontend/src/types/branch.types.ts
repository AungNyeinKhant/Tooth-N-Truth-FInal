export interface BranchManager {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  managers?: BranchManager[];
}

export interface BranchQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedBranches {
  data: Branch[];
  meta: PaginationMeta;
}
