/**
 * Error Handling Utilities
 * Provides safe type-narrowing and message extraction for unknown caught errors.
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch'))) {
    return true;
  }
  return false;
}
