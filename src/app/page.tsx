import styles from "./page.module.css";
import { routes } from "@/lib/routes";
import Link from "next/link";

export default async () => (
  <div className={styles.page}>
    <main className={styles.main}>
      <h1>Welcome to sergn.io</h1>
      <div>
        {routes.map(({ route, displayName }) => (
          <Link key={route} href={route}>
            <h2>{displayName}</h2>
          </Link>
        ))}
      </div>
    </main>
    <footer className={styles.footer}>
      <p>© 2024 sergn.io</p>
    </footer>
  </div>
);
