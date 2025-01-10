import { routes } from "@/lib/routes";
import Link from "next/link";
import styles from "./header.module.css";

export default () => {
  // const { currentRoute } = useServerRoute();
  // todo get the route hightling to work??
  const currentRoute = true;
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
