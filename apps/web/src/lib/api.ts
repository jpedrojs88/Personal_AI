const API_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? "http://localhost:3333" : "https://personal-ia-api.onrender.com");

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Nao foi possivel conectar ao servidor agora. Verifique se o backend esta ativo e tente novamente.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.message ?? "Nao foi possivel completar a requisicao.",
      response.status,
      typeof body.code === "string" ? body.code : undefined,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
