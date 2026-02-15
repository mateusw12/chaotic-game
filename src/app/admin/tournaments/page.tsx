import { redirect } from "next/navigation";
import { TournamentsView } from "@/components/admin/tournaments-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listTournaments } from "@/lib/supabase";

export default async function TournamentsPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const tournaments = await listTournaments();

    return <TournamentsView tournaments={tournaments} />;
}
