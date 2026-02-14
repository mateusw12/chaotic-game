import { redirect } from "next/navigation";
import { BattleGearView } from "../../../components/admin/battlegear-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listBattleGear, listCreatures } from "@/lib/supabase";

export default async function BattleGearPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const [battlegear, creatures] = await Promise.all([
        listBattleGear(),
        listCreatures(),
    ]);

    return <BattleGearView battlegear={battlegear} creatures={creatures} />;
}
