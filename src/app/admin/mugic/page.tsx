import { redirect } from "next/navigation";
import { MugicView } from "@/components/admin/mugic-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listMugics } from "@/lib/supabase";

export default async function MugicPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const mugics = await listMugics();

    return <MugicView mugics={mugics} />;
}
