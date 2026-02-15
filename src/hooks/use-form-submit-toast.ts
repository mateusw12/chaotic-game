"use client";

import { useCallback } from "react";
import type { MessageInstance } from "antd/es/message/interface";

type SubmitToastOptions = {
    successMessage?: string;
    defaultErrorMessage?: string;
};

export function useFormSubmitToast(messageApi: MessageInstance) {
    const runWithSubmitToast = useCallback(
        async <T>(action: () => Promise<T>, options: SubmitToastOptions = {}): Promise<T | null> => {
            try {
                const result = await action();

                if (options.successMessage) {
                    messageApi.success(options.successMessage);
                }

                return result;
            } catch (error) {
                messageApi.error(
                    error instanceof Error
                        ? error.message
                        : options.defaultErrorMessage ?? "Erro ao salvar formulário.",
                );

                return null;
            }
        },
        [messageApi],
    );

    return {
        runWithSubmitToast,
    };
}
