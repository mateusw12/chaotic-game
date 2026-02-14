import { redirect } from "next/navigation";
import { StoreView } from "@/components/store/store-view";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail } from "@/lib/supabase";

export default async function StorePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/");
    }

    let dashboard = null;

    try {
        dashboard = await getUserDashboardByEmail(session.user.email);
    } catch (error) {
        console.error("Erro ao carregar dashboard para loja:", error);
    }

    return (
        <StoreView
            userName={dashboard?.userName ?? session.user.name ?? null}
            userNickName={dashboard?.userNickName ?? null}
            userImageUrl={dashboard?.userImageUrl ?? session.user.image ?? null}
        />
    );
}
