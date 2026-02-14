"use client";

import { useMemo } from "react";

type UseDisplayUserNameParams = {
    name: string | null;
    nickName: string | null;
};

export function useDisplayUserName({ name, nickName }: UseDisplayUserNameParams): string {
    return useMemo(() => {
        const normalizedNick = nickName?.trim();

        if (normalizedNick) {
            return normalizedNick;
        }

        const normalizedName = name?.trim();

        if (normalizedName) {
            return normalizedName;
        }

        return "Jogador";
    }, [name, nickName]);
}
