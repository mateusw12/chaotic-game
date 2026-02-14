"use client";

import { ConfigProvider, theme } from "antd";

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
            {children}
        </ConfigProvider>
    );
}
