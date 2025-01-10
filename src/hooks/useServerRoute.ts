import { headers } from "next/headers";

export default () => {
  const { get } = headers();
  const currentRoute = get("x-page-url");
  return { currentRoute };
};
