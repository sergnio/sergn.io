import { routes } from "@/lib/routes";
import Link from "next/link";
import styles from "./header.module.css";
import useServerRoute from "@/hooks/useServerRoute";

export default () => {
  const { currentRoute } = useServerRoute();
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {routes.map(({ displayName, route }) => (
          <Link
            key={route}
            href={route}
            className={currentRoute === route ? styles.active : styles.link}
          >
            {displayName}
          </Link>
        ))}
      </nav>
    </header>
  );
};
