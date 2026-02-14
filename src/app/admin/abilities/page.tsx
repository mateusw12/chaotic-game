import { redirect } from "next/navigation";
import { AbilitiesView } from "@/components/admin/abilities-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listAbilities } from "@/lib/supabase";

export default async function AbilitiesPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const abilities = await listAbilities();

    return <AbilitiesView abilities={abilities} />;
}
