import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { getSummonerByPuuidQueryOptions } from "./queryOptions";
import Home from "./pages";
import Account from "./pages/account";
import ItemsPage from "./pages/data/items";
import ItemHistory from "./pages/data/items/[itemId]/history";
import Login from "./pages/login";
import PuuidPage from "./pages/puuid/[puuid]";
import SignUp from "./pages/signup";
import Verify from "./pages/verify";
import SummonerPage from "./pages/[region]/[searchName]";
import Match from "./pages/[region]/[searchName]/[match]";
import MatchSummary from "./pages/[region]/[searchName]/[match]/summary";
import {
  matchSearchSchema,
  summonerSearchSchema,
  verifySearchSchema,
} from "./searchParams";
import { searchNameParamsSchema } from "./routeParams";

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [{ title: "hardstuck.club" }] }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
  notFoundComponent: () => <div className="p-8">Page not found.</div>,
});

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/account",
    component: Account,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/data/items",
    component: ItemsPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/data/items/$itemId/history",
    component: ItemHistory,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/puuid/$puuid",
    component: PuuidPage,
    loader: ({ context, params }) =>
      context.queryClient
        .query(getSummonerByPuuidQueryOptions(params.puuid))
        .catch(() => {}),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/signup",
    component: SignUp,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/verify",
    component: Verify,
    validateSearch: verifySearchSchema,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/$region/$searchName",
    component: SummonerPage,
    params: {
      parse: (params) => ({
        ...params,
        ...searchNameParamsSchema.parse(params),
      }),
    },
    validateSearch: summonerSearchSchema,
    head: ({ params }) => ({
      meta: [{ title: `${params.searchName.trim()} | hardstuck.club` }],
    }),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/$region/$searchName/$match",
    component: Match,
    params: {
      parse: (params) => ({
        ...params,
        ...searchNameParamsSchema.parse(params),
      }),
    },
    validateSearch: matchSearchSchema,
    head: () => ({
      meta: [{ title: "Match Details | hardstuck.club" }],
    }),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/$region/$searchName/$match/summary",
    component: MatchSummary,
    params: {
      parse: (params) => ({
        ...params,
        ...searchNameParamsSchema.parse(params),
      }),
    },
  }),
];

const routeTree = rootRoute.addChildren(routes);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
