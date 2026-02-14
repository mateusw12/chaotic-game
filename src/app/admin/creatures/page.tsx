import { redirect } from "next/navigation";
import { CreaturesView } from "@/components/admin/creatures-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listCreatures } from "@/lib/supabase";

export default async function CreaturesPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const creatures = await listCreatures();
    return <CreaturesView creatures={creatures} />;
}
