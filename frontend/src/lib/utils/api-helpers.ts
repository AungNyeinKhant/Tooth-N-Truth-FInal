/**
 * Unwraps API response data from axios response
 * Handles both direct data and nested { data: ... } structure
 */
export function unwrapApiResponse<T>(responseData: unknown): T {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return (responseData as { data: T }).data;
  }
  return responseData as T;
}

/**
 * Extracts error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err.response?.data?.message || err.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}
