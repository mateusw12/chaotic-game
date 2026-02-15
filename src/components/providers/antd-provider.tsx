"use client";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import { QueryProvider } from "@/components/providers/query-provider";

type AntdProviderProps = {
    children: React.ReactNode;
};

export function AntdProvider({ children }: AntdProviderProps) {
    return (
        <QueryProvider>
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                    token: {
                        colorPrimary: "#7c4dff",
                        borderRadius: 12,
                    },
                }}
            >
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </QueryProvider>
    );
}
