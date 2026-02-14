import { auth, signIn, signOut } from "@/lib/auth";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Chaotic Game</h1>
          <p>
            Faça login para acessar a página inicial do jogo com autenticação via
            Google.
          </p>
          {session?.user?.name ? (
            <p className={styles.user}>Conectado como {session.user.name}.</p>
          ) : null}
        </div>
        <div className={styles.ctas}>
          {session ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className={styles.secondary} type="submit">
                Sair
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button className={styles.primary} type="submit">
                Entrar com Google
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
