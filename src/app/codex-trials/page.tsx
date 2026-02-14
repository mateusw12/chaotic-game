import { redirect } from "next/navigation";
import { CodexTrialsView } from "@/components/codex/codex-trials-view";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail } from "@/lib/supabase";

export default async function CodexTrialsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/");
    }

    let dashboard = null;

    try {
        dashboard = await getUserDashboardByEmail(session.user.email);
    } catch (error) {
        console.error("Erro ao carregar dashboard para Codex Trials:", error);
    }

    return (
        <CodexTrialsView
            userName={dashboard?.userName ?? session.user.name ?? null}
            userNickName={dashboard?.userNickName ?? null}
            userImageUrl={dashboard?.userImageUrl ?? session.user.image ?? null}
            userRole={dashboard?.userRole ?? "user"}
            coins={dashboard?.coins ?? 0}
            diamonds={dashboard?.diamonds ?? 0}
        />
    );
}
