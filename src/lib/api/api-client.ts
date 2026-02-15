type ApiClientRequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: BodyInit | null;
    headers?: HeadersInit;
};

export class ApiClientError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly data: unknown,
    ) {
        super(message);
        this.name = "ApiClientError";
    }
}

export class ApiClient {
    private static readonly nextApiBase = "/api";

    private static normalizePath(path: string) {
        if (path.startsWith("/api")) {
            return path;
        }

        return `${this.nextApiBase}${path.startsWith("/") ? path : `/${path}`}`;
    }

    private static async parseResponse<T>(response: Response): Promise<T | null> {
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
            return null;
        }

        return (await response.json()) as T;
    }

    static async request<TResponse>(path: string, options: ApiClientRequestOptions = {}): Promise<TResponse> {
        const response = await fetch(this.normalizePath(path), {
            method: options.method ?? "GET",
            body: options.body,
            headers: options.headers,
        });

        const data = await this.parseResponse<TResponse>(response);

        if (!response.ok) {
            const defaultMessage = `Request failed with status ${response.status}.`;
            const message =
                data && typeof data === "object" && "message" in data && typeof data.message === "string"
                    ? data.message
                    : defaultMessage;

            throw new ApiClientError(message, response.status, data);
        }

        return data as TResponse;
    }

    static get<TResponse>(path: string) {
        return this.request<TResponse>(path, { method: "GET" });
    }

    static post<TResponse, TBody>(path: string, body: TBody) {
        return this.request<TResponse>(path, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    static patch<TResponse, TBody>(path: string, body: TBody) {
        return this.request<TResponse>(path, {
            method: "PATCH",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    static put<TResponse, TBody>(path: string, body: TBody) {
        return this.request<TResponse>(path, {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    static delete<TResponse>(path: string) {
        return this.request<TResponse>(path, { method: "DELETE" });
    }

    static postFormData<TResponse>(path: string, formData: FormData) {
        return this.request<TResponse>(path, {
            method: "POST",
            body: formData,
        });
    }
}
