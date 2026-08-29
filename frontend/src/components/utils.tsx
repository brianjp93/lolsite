import { format } from "date-fns";
import { ItemPopover } from "../components/data/item";
import type { BasicMatchType, FullParticipantType } from "@/external/types.tsx";
import { useItem } from "@/hooks.tsx";
import type { BasicParticipantType } from "@/external/iotypes/match.tsx";
import { ARENA_QUEUE } from "@/utils/constants.ts";

export function formatDatetime(epoch: number) {
  return format(new Date(epoch), "MMM d h:mma");
}

export function formatDatetimeFull(epoch: number) {
  return format(new Date(epoch), "MMM d, yyyy h:mma");
}

export function formatDatetimeTime(epoch: number) {
  return format(new Date(epoch), "h:mm a");
}

export function getTeam<T>(
  num: number,
  participants: ({ team_id: number } & T)[],
) {
  return participants.filter((item) => item.team_id === num);
}

export function getWinner<T>(
  queueId: number,
  participants: ({ placement: number; team_id: number } & T)[],
) {
  if (queueId === ARENA_QUEUE) {
    return participants.filter((x) => x.placement === 1);
  }
  return participants.filter((x) => x.team_id === 100);
}

export function getLoser<T>(
  queueId: number,
  participants: ({ placement: number; team_id: number } & T)[],
) {
  if (queueId === ARENA_QUEUE) {
    return participants.filter((x) => x.placement > 1);
  }
  return participants.filter((x) => x.team_id === 200);
}

export function convertTier(tier: string) {
  let out = "";
  if (tier.toLowerCase() === "grandmaster") {
    out = "GM";
  } else {
    out = tier[0] || "";
  }
  return out;
}

export function convertRank(rank: string) {
  const dict = {
    I: "1",
    II: "2",
    III: "3",
    IV: "4",
    V: "5",
  };
  if (dict[rank as keyof typeof dict] !== undefined) {
    return dict[rank as keyof typeof dict];
  }
  return rank;
}

export function Item(id: number, image_url: string, match: BasicMatchType) {
  const query = useItem({ id, major: match.major, minor: match.minor });
  return (
    <ItemPopover
      style={{
        display: "inline-block",
        height: 28,
        width: 28,
        margin: "0px 2px",
      }}
      item={query.data}
      item_id={id}
      major={match.major}
      minor={match.minor}
    >
      <div
        style={{
          display: "inline-block",
          height: 28,
          width: 28,
          borderRadius: 10,
          margin: "0px 2px",
          borderStyle: "solid",
          borderColor: "#2d2e31",
          borderWidth: 1,
        }}
      >
        <img
          style={{ height: "100%", borderRadius: 10, display: "inline-block" }}
          src={image_url}
          alt=""
        />
      </div>
    </ItemPopover>
  );
}

export function getMyPart<
  T extends FullParticipantType[] | BasicParticipantType[],
>(participants: T, puuid: string): T[number] | undefined {
  for (const part of participants) {
    if (part.puuid === puuid) {
      return part;
    }
  }
  return undefined;
}

export function getStatCosts() {
  const stats_costs = {
    PercentAttackSpeedMod: 300 / 0.12,
    FlatMPPoolMod: 350 / 250,
    FlatHPPoolMod: 400 / 150,
    PercentMovementSpeedMod: 3950,
    FlatPhysicalDamageMod: 350 / 10,
    FlatMagicDamageMod: 435 / 20,
    FlatArmorMod: 300 / 15,
    FlatSpellBlockMod: 450 / 25,
    PercentLifeStealMod: 375 / 0.1,
    PhysicalVamp: 30,
    SpellVamp: 27.5,
    OmniVamp: 39.67,
    FlatCritChanceMod: 800 / 0.2,
    FlatHPRegenMod: 36,
    FlatMovementSpeedMod: 300 / 25,

    BaseManaRegen: 150 / 50,
    Lethality: 5,
    Haste: 26.67,
    // MagicPen: 16 * 100,
    CooldownReduction: 26.67,
    HealAndShieldPower: 56.67,
    Heal: 0.3333,
    PercentBaseHPRegen: 3,
    FlatMagicPen: 31.11,
    ArmorPen: 0,
    MagicPen: 0,
  };
  // calculating value of armor pen against
  // an enemy with 100 armor
  stats_costs.ArmorPen = stats_costs.FlatArmorMod * 100;
  stats_costs.MagicPen = stats_costs.FlatSpellBlockMod * 100;
  return stats_costs;
}

export function stripHtml(html: string) {
  return html.replace(/<(?!br\s*\/?)[^>]+>/g, "");
}

export function stripHtmlFull(html: string) {
  const elt = document.createElement("div");
  elt.innerHTML = html;
  return elt.textContent;
}

export function ErrorField({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="my-1 text-sm font-bold text-red-600">{message}</div>;
}

export function mediaUrl(filePath: string | null | undefined) {
  return filePath || "";
}

export function queueColor(queue_id: number) {
  // ranked 5v5 solo
  if (queue_id === 420) {
    return "text-cyan-600";
  }
  // ranked 5v5 flex
  else if (queue_id === 440) {
    return "text-emerald-600";
  }
  // aram
  else if ([100, 450].includes(queue_id)) {
    return "text-red-400";
  } else if ([900, 1010].includes(queue_id)) {
    return "text-black";
  }
  return "";
}
