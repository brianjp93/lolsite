import Skeleton from "@/components/general/skeleton";
import { useAllItems } from "@/hooks";

import { Item, type ItemType } from "@/external/iotypes/data";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorField, mediaUrl } from "@/components/utils";
import Image from "@/compat/image";
import { Link } from "@tanstack/react-router";
import numeral from "numeral";

function fuzzyMatch(pattern: string, str: string) {
  pattern = ".*" + pattern.toLowerCase().split("").join(".*") + ".*";
  const re = new RegExp(pattern);
  return re.test(str.toLowerCase());
}

export default function ItemsPage() {
  const itemsQ = useAllItems({ map_id: 11 });
  const items = itemsQ.data?.data || [];
  return (
    <Skeleton>
      <ItemsPageInner items={items} />
    </Skeleton>
  );
}

const orderByOptions = [
  "price desc",
  "price asc",
  "stat efficiency desc",
  "stat efficiency asc",
] as const;
const itemStat = Item.shape.stats.keyof();
const statLabels: Record<keyof ItemType["stats"], string> = {
  flat_armor: "Armor",
  percent_crit: "Critical Strike Chance (%)",
  flat_health: "Health",
  percent_health_regen: "Health Regen (%)",
  flat_ability_power: "Ability Power",
  flat_movement_speed: "Move Speed (flat)",
  flat_mana: "Mana",
  flat_attack_damage: "Attack Damage",
  flat_magic_resist: "Magic Resist",
  percent_attack_speed: "Attack Speed (%)",
  adaptive_force: "Adaptive Force",
  percent_movement_speed: "Move Speed (%)",
  percent_life_steal: "Life Steal (%)",
  flat_lethality: "Lethality",
  flat_ability_haste: "Ability Haste",
  percent_heal_and_shield_power: "Heal & Shield Power (%)",
  percent_omnivamp: "Omnivamp (%)",
  percent_armor_penetration: "Armor Penetration (%)",
  percent_base_mana_regen: "Mana Regen (%)",
  percent_tenacity: "Tenacity (%)",
  percent_magic_penetration: "Magic Penetration (%)",
  percent_crit_damage: "Critical Strike Damage (%)",
  flat_magic_penetration: "Magic Penetration (flat)",
};

const sortedStats = [...itemStat.options].sort((a, b) =>
  statLabels[a].localeCompare(statLabels[b]),
);

const ItemFormSchema = z.object({
  search: z.string(),
  order_by: z.string(),
  stats: z.array(itemStat),
});
type ItemFormSchema = z.infer<typeof ItemFormSchema>;

function ItemsPageInner({ items }: { items: ItemType[] }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ItemFormSchema>({
    resolver: zodResolver(ItemFormSchema),
    defaultValues: {
      order_by: "price desc",
      search: "",
      stats: [],
    },
  });

  const search = watch("search");
  const orderBy = watch("order_by");
  const selectedStats = watch("stats");

  const filteredItems = items.filter((x) => {
    if (x.required_champion) {
      return false;
    }
    return (
      (!search || fuzzyMatch(search, x.name)) &&
      selectedStats.every((stat) => (x.stats[stat] ?? 0) !== 0)
    );
  });

  if (orderBy === "price desc") {
    filteredItems.sort((a, b) => b.gold.total - a.gold.total);
  } else if (orderBy === "price asc") {
    filteredItems.sort((a, b) => a.gold.total - b.gold.total);
  } else if (orderBy === "stat efficiency desc") {
    filteredItems.sort(
      (a, b) => b.stat_efficiency.gold_efficiency - a.stat_efficiency.gold_efficiency,
    );
  } else if (orderBy === "stat efficiency asc") {
    filteredItems.sort(
      (a, b) => a.stat_efficiency.gold_efficiency - b.stat_efficiency.gold_efficiency,
    );
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="w-full sticky top-0 bg-gray-900 p-3 shadow-md rounded-md">
          <label className="my-2">
            <div>search</div>
            <input className="w-full" type="text" {...register("search")} />
          </label>
          <ErrorField message={errors.search?.message} />

          <label className="my-2">
            <div>order by</div>
            <select className="w-full" {...register("order_by")}>
              {orderByOptions.map((option) => {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              })}
            </select>
          </label>
          <ErrorField message={errors.order_by?.message} />

          <fieldset className="mt-3">
            <legend className="mb-2 text-sm font-bold">Stats (match all)</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 max-h-48 overflow-y-auto">
              {sortedStats.map((stat) => (
                <label key={stat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={stat}
                    {...register("stats")}
                    className="h-4 w-4 shrink-0 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  />
                  {statLabels[stat]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap">
          {filteredItems.map((x) => {
            return (
              <div
                key={x.id}
                className="m-2 w-56 p-2 bg-gray-900 rounded-md max-h-52 overflow-y-scroll quiet-scroll"
              >
                <div className="flex mb-2">
                  <Image
                    src={mediaUrl(x.image.file_40 || "")}
                    height={40}
                    width={40}
                    alt={x.name}
                    className="h-[40px]"
                  />
                  <Link
                    to="/data/items/$itemId/history"
                    params={{ itemId: String(x._id) }}
                  >
                    <div className="ml-1 text-sm font-bold">{x.name}</div>
                  </Link>
                  <div>
                    <div className="ml-3 text-sm font-bold text-yellow-600">
                      {x.gold.total}g
                    </div>
                    <div
                      title="stat gold efficiency"
                      className="ml-3 text-sm font-bold text-cyan-300"
                    >
                      {numeral(x.stat_efficiency.gold_efficiency).format("0")}%
                    </div>
                    {x.last_changed && (
                      <div className="text-sm">
                        Last Changed: {x.last_changed}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: x.description }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
