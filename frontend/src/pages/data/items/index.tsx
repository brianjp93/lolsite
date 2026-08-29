import Skeleton from "@/components/general/skeleton";
import { useAllItems } from "@/hooks";

import type { ItemType } from "@/external/iotypes/data";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorField, mediaUrl } from "@/components/utils";
import Image from "@/compat/image";
import { Link } from "@tanstack/react-router";
import { itemHistoryRoute } from "./[itemId]/history";
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

const orderByOptions = ["price desc", "price asc"] as const;

const LoginSchema = z.object({
  search: z.string(),
  order_by: z.string(),
});
type LoginSchema = z.infer<typeof LoginSchema>;

function ItemsPageInner({ items }: { items: ItemType[] }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      order_by: 'price desc',
      search: '',
    }
  });

  const search = watch("search");
  const orderBy = watch("order_by");

  const filteredItems = items.filter((x) => {
    if (x.required_champion) {
      return false;
    }
    return search ? fuzzyMatch(search, x.name) : true;
  });

  if (orderBy === 'price desc') {
    filteredItems.sort((a, b) => b.gold.total - a.gold.total)
  } else if (orderBy === 'price asc') {
    filteredItems.sort((a, b) => a.gold.total - b.gold.total)
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
          <ErrorField message={errors.search?.message} />
        </div>

        <div className="flex flex-wrap">
          {filteredItems.map((x) => {
            return (
              <div key={x.id} className="m-2 w-56 p-2 bg-gray-900 rounded-md max-h-52 overflow-y-scroll quiet-scroll">
                <div className="flex mb-2">
                  <Image src={mediaUrl(x.image.file_40 || "")} height={40} width={40} alt={x.name} className="h-[40px]" />
                  <Link to={itemHistoryRoute(x._id)}>
                    <div className="ml-1 text-sm font-bold">
                      {x.name}
                    </div>
                  </Link>
                  <div>
                    <div className="ml-3 text-sm font-bold text-yellow-600">{x.gold.total}g</div>
                    <div title="stat gold efficiency" className="ml-3 text-sm font-bold text-cyan-300">{numeral(x.stat_efficiency.gold_efficiency).format('0')}%</div>
                    {x.last_changed &&
                      <div className="text-sm">Last Changed: {x.last_changed}</div>
                    }
                  </div>
                </div>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: x.description }} />
              </div>
            );
          })}
        </div>
      </div>

    </>
  );
}
