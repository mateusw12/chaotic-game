import { redirect } from "next/navigation";
import { TournamentsView } from "@/components/tournaments/tournaments-view";
import type { TournamentDto } from "@/dto/tournament";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail, listAvailableTournaments } from "@/lib/supabase";

export default async function TournamentsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/");
    }

    let dashboard = null;
    let tournaments: TournamentDto[] = [];

    try {
        dashboard = await getUserDashboardByEmail(session.user.email);
    } catch (error) {
        console.error("Erro ao carregar dashboard para torneios:", error);
    }

    try {
        tournaments = await listAvailableTournaments();
    } catch (error) {
        console.error("Erro ao carregar torneios disponíveis:", error);
    }

    return (
        <TournamentsView
            userName={dashboard?.userName ?? session.user.name ?? null}
            userNickName={dashboard?.userNickName ?? null}
            userImageUrl={dashboard?.userImageUrl ?? session.user.image ?? null}
            userRole={dashboard?.userRole ?? "user"}
            coins={dashboard?.coins ?? 0}
            diamonds={dashboard?.diamonds ?? 0}
            tournaments={tournaments}
        />
    );
}
