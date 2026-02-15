"use client";

import { useCallback } from "react";
import type { ArgsProps } from "antd/es/notification/interface";

type ToastApi = {
    success: (args: ArgsProps) => unknown;
    error: (args: ArgsProps) => unknown;
};

type SubmitToastOptions = {
    successMessage?: string;
    defaultErrorMessage?: string;
};

export function useFormSubmitToast(messageApi: ToastApi) {
    const runWithSubmitToast = useCallback(
        async <T>(action: () => Promise<T>, options: SubmitToastOptions = {}): Promise<T | null> => {
            try {
                const result = await action();

                if (options.successMessage) {
                    messageApi.success({ message: options.successMessage });
                }

                return result;
            } catch (error) {
                messageApi.error({
                    message: error instanceof Error
                        ? error.message
                        : options.defaultErrorMessage ?? "Erro ao salvar formulário.",
                });

                return null;
            }
        },
        [messageApi],
    );

    return {
        runWithSubmitToast,
    };
}
