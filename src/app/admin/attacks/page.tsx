import { redirect } from "next/navigation";
import { AttacksView } from "@/components/admin/attacks-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listAttacks } from "@/lib/supabase";

export default async function AttacksPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const attacks = await listAttacks();

    return <AttacksView attacks={attacks} />;
}
