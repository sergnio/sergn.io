import { glob } from "glob";

type Route = {
  displayName: string;
  route: string;
};

export const getAppRoutes = async (): Promise<Route[]> => {
  const result: string[] = [];
  const routes = await glob("*/", { cwd: __dirname });

  for (const route of routes) {
    if (route.endsWith("ico")) {
      break; // stop if a route ends with "ico"
    }
    result.push(route);
  }

  return result.map((route) => ({
    // capitalize the first letter of the route
    displayName: route.charAt(0).toUpperCase() + route.slice(1),
    route: route.replace(/\/$/, ""),
  }));
};
