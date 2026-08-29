import { getStatMod } from "@/utils/constants";
import clsx from "clsx";
import Image from "@/compat/image";

export function StatModTable(props) {
  const participant = props.participant;
  const statmods = getStatMod("latest");

  const perk_0_order = ['statmodsadaptiveforceicon', 'statmodsattackspeedicon', 'statmodscdrscalingicon'];
  const perk_1_order = ['statmodsadaptiveforceicon', 'statmodsmovementspeedicon', 'statmodshealthplusicon'];
  const perk_2_order = ['statmodshealthscalingicon', 'statmodstenacityicon', 'statmodshealthplusicon'];
  const table_rows = [perk_0_order, perk_1_order, perk_2_order];

  return (
    <div>
      {table_rows.map((perks, perk_int) => {
        return (
          <div key={`${participant.riot_id_name}-${perk_int}`}>
            {perks.map((perk_id, key) => {
              const perk = statmods[perk_id];
              const is_perk_selected =
                participant.stats[`stat_perk_${perk_int}`] === perk.id;
              return (
                <div
                  key={`${perk_id}-${key}`}
                  style={{ display: "inline-block" }}
                >
                  <div
                    data-tip={perk.name}
                    className={clsx("m-2 inline-block p-2", {
                      "rounded-full border-gray-400 border": is_perk_selected,
                    })}
                  >
                    <Image
                      height={30}
                      width={30}
                      className={clsx("align-bottom", {
                        "grayscale-[1]": !is_perk_selected,
                      })}
                      src={statmods[perk_id].image_url}
                      alt=""
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
