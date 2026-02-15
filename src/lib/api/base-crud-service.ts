import { ApiClient } from "@/lib/api/api-client";

type ApiSuccessResponse = {
    success: boolean;
    message?: string;
};

type ApiEntityResponse<TEntity, TEntityKey extends string> =
    ApiSuccessResponse &
    Record<TEntityKey, TEntity | null>;

type ApiListResponse<TEntity, TListKey extends string> =
    ApiSuccessResponse &
    Record<TListKey, TEntity[]>;

export abstract class BaseCrudService {
    protected static async listEntities<TEntity, TListKey extends string>(
        resourcePath: string,
        listKey: TListKey,
    ): Promise<TEntity[]> {
        const data = await ApiClient.get<ApiListResponse<TEntity, TListKey>>(resourcePath);

        if (!data.success) {
            throw new Error(data.message ?? "Falha ao listar registros.");
        }

        return data[listKey] ?? [];
    }

    protected static async getEntityById<TEntity, TEntityKey extends string>(
        resourcePath: string,
        id: string,
        entityKey: TEntityKey,
    ): Promise<TEntity> {
        const data = await ApiClient.get<ApiEntityResponse<TEntity, TEntityKey>>(`${resourcePath}/${id}`);

        if (!data.success || !data[entityKey]) {
            throw new Error(data.message ?? "Falha ao buscar registro.");
        }

        return data[entityKey];
    }

    protected static async createEntity<TPayload, TEntity, TEntityKey extends string>(
        resourcePath: string,
        payload: TPayload,
        entityKey: TEntityKey,
    ): Promise<TEntity> {
        const data = await ApiClient.post<ApiEntityResponse<TEntity, TEntityKey>, TPayload>(resourcePath, payload);

        if (!data.success || !data[entityKey]) {
            throw new Error(data.message ?? "Falha ao criar registro.");
        }

        return data[entityKey];
    }

    protected static async updateEntity<TPayload, TEntity, TEntityKey extends string>(
        resourcePath: string,
        id: string,
        payload: TPayload,
        entityKey: TEntityKey,
    ): Promise<TEntity> {
        const data = await ApiClient.patch<ApiEntityResponse<TEntity, TEntityKey>, TPayload>(`${resourcePath}/${id}`, payload);

        if (!data.success || !data[entityKey]) {
            throw new Error(data.message ?? "Falha ao atualizar registro.");
        }

        return data[entityKey];
    }

    protected static async removeEntity(resourcePath: string, id: string): Promise<void> {
        const data = await ApiClient.delete<ApiSuccessResponse>(`${resourcePath}/${id}`);

        if (!data.success) {
            throw new Error(data.message ?? "Falha ao remover registro.");
        }
    }
}
