"use client";

import { App as AntdApp, ConfigProvider, theme } from "antd";

type AntdProviderProps = {
    children: React.ReactNode;
};

export function AntdProvider({ children }: AntdProviderProps) {
    return (
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
    );
}
