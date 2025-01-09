import styles from "./page.module.css";
import { routes } from "@/lib/routes";
import Link from "next/link";

export default () => (
  <div className={styles.page}>
    <main className={styles.main}>
      <h1>sergn.io</h1>
      <div>
        {routes.map(({ route, displayName }) => (
          <Link key={route} href={route}>
            <h2>{displayName}</h2>
          </Link>
        ))}
      </div>
    </main>
    <footer className={styles.footer}>
      <p>© {new Date().getFullYear()} sergn.io</p>
    </footer>
  </div>
);
