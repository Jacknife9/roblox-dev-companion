// Web sessions are HttpOnly cookies. JavaScript never reads or stores the token.
export const readToken = async (): Promise<string | null> => null;
export const saveToken = async (_token: string): Promise<void> => {};
export const clearToken = async (): Promise<void> => {};
