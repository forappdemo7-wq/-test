import { describe, it, expect } from 'vitest';
import { parsePaginationParams, createPaginatedResponse } from '../../server/core/pagination/pagination';

describe('Pagination Helpers (Unit Tests)', () => {
  it('should parse valid pagination query parameters', () => {
    const params = parsePaginationParams({ page: '3', limit: '15' });
    expect(params.page).toBe(3);
    expect(params.limit).toBe(15);
    expect(params.offset).toBe(30);
  });

  it('should clamp limit to max 100 and default invalid values', () => {
    const params = parsePaginationParams({ page: '-5', limit: '500' });
    expect(params.page).toBe(1);
    expect(params.limit).toBe(100);
    expect(params.offset).toBe(0);
  });

  it('should build accurate pagination metadata', () => {
    const items = ['a', 'b', 'c'];
    const response = createPaginatedResponse(items, 25, 2, 10);

    expect(response.data).toEqual(items);
    expect(response.pagination.total).toBe(25);
    expect(response.pagination.totalPages).toBe(3);
    expect(response.pagination.page).toBe(2);
    expect(response.pagination.limit).toBe(10);
    expect(response.pagination.hasNextPage).toBe(true);
    expect(response.pagination.hasPrevPage).toBe(true);
  });
});
