import numeral from "numeral";
import clsx from "clsx";

interface ImpactRankProps {
  impact_rank?: number;
  impact_score?: number;
}

export function ImpactRank({ impact_rank, impact_score }: ImpactRankProps) {
  const format = (x: number, fmt = "0.00") => numeral(x).format(fmt);

  return impact_rank ? (
    <div
      className={clsx("rounded px-1 text-xs font-bold", {
        "bg-blue-600": impact_rank === 1,
        "bg-orange-600": impact_rank === 2,
        "bg-orange-700": impact_rank === 3,
        "bg-red-600": impact_rank === 4,
        "bg-red-700": impact_rank === 5,
        "bg-red-800": impact_rank === 6,
        "bg-red-900": impact_rank === 7,
        "bg-red-950": impact_rank === 8,
        "bg-stone-800": impact_rank === 9,
        "bg-stone-900": impact_rank === 10,
      })}
    >
      {impact_rank === 1 ? "MVP" : impact_rank}
    </div>
  ) : (
    <div className="text-xs">
      {format(impact_score || 0, "0.00")} <span className="text-xs">IS</span>
    </div>
  );
}
