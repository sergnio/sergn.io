type Route = {
  displayName: string;
  route: string;
};

const wings = "/wings";
const syrup = "/syrup";
const coffee = "/coffee";

const routeList = [wings, syrup, coffee];

export const routes: Route[] = routeList.map((route) => {
  const trimmedRoute = route.replace("/", "");
  return {
    displayName: `${trimmedRoute[0].toUpperCase()}${trimmedRoute.slice(1)}`,
    route,
  };
});
