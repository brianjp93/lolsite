import Skeleton from "@/components/general/skeleton";
import { useItemHistory } from "@/hooks";
import { getRouteApi } from "@tanstack/react-router";
import numeral from "numeral";
import { Fragment } from "react";

const routeApi = getRouteApi("/data/items/$itemId/history");

export default function ItemHistory() {
  const { itemId } = routeApi.useParams();

  const itemHistoryQ = useItemHistory(itemId);
  const itemHistory = itemHistoryQ.data || [];
  const mainItem = itemHistory[0];

  return (
    <Skeleton>
      <div className="flex flex-col gap-y-4 w-full">
        {mainItem ? (
          <>
            <h1>{mainItem.name}</h1>
            <hr />
          </>
        ) : (
          <h1>No item history found</h1>
        )}
        {itemHistory.map((item) => {
          return (
            <Fragment key={item.id}>
              <div className="p-4 rounded-md bg-slate-800 w-full flex flex-col gap-2">
                <div>
                  Version: {item.version}
                  <span className="text-yellow-600 font-bold ml-2">
                    ({item.gold.total}g)
                  </span>
                </div>
                <hr />
                <div className="text-lg font-bold">Diff</div>
                <div className="flex flex-col gap-y-1">
                  {Object.entries(item.diff || {}).map(([key, val]) => {
                    return (
                      <Fragment key={key}>
                        <div className="flex gap-x-2">
                          <div className="w-40 min-w-fit">{key}</div>
                          <div className="flex gap-x-2">
                            <div className="line-through text-red-500 font-bold">
                              {val.prev || "na"}
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                              />
                            </svg>
                            <div className="font-bold">{val.curr}</div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>

                <div className="mt-4 text-lg font-bold">Stats</div>
                <div className="flex flex-col">
                  {Object.entries(item.stats || {}).map(([key, val]) => {
                    if (val === null) {
                      return null;
                    }
                    const gold = item.stat_efficiency?.[key];
                    return (
                      <div key={key} className="flex gap-x-2">
                        <div className="w-40">{key}:</div>
                        <div>
                          {val}
                          {key.includes("percent") && "%"}
                        </div>
                        {typeof gold == "object" && (
                          <div className="font-bold text-yellow-600">
                            ({numeral(gold.gold_value).format("0.00")}g)
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex gap-x-2">
                    <div className="w-40"></div>
                    <div className="flex gap-x-2">
                      <div className="text-yellow-600 font-bold">
                        {numeral(item.stat_efficiency.calculated_cost).format(
                          "0",
                        )}
                        g
                      </div>
                      <div className="font-bold text-cyan-200">
                        (
                        {numeral(item.stat_efficiency.gold_efficiency).format(
                          "0",
                        )}
                        % gold efficient)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-lg font-bold">Description</div>
                <div>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                />
              </svg>
            </Fragment>
          );
        })}
      </div>
    </Skeleton>
  );
}
