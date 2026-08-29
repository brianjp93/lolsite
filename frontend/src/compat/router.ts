import {
  useLocation,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";

type Query = Record<string, unknown>;
type Destination = string | { query?: Query };

export function useRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as Record<string, string>;
  const search = useSearch({ strict: false }) as Query;
  const query = { ...search, ...params };

  const go = (destination: Destination, replace = false) => {
    if (typeof destination === "string") {
      return navigate({ to: destination, replace });
    }

    const nextSearch = { ...destination.query };
    for (const key of Object.keys(params)) delete nextSearch[key];
    return navigate({ to: location.pathname, search: nextSearch, replace });
  };

  return {
    query,
    asPath: location.href,
    pathname: location.pathname,
    push: (destination: Destination) => go(destination),
    replace: (destination: Destination) => go(destination, true),
  };
}
