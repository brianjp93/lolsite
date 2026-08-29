import Skeleton from "@/components/general/skeleton";
import { ErrorField, mediaUrl } from "@/components/utils";
import type { UserType, SummonerType } from "@/external/types";
import { useUser, useConnectedSummoners } from "@/hooks";
import Image from "@/compat/image";
import { useState } from "react";
import api from "@/external/api/api";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { REGIONS } from "@/utils/constants";

export default function Account() {
  const userQ = useUser();
  const user = userQ.data;
  const connectedQ = useConnectedSummoners();
  const connected = connectedQ.data || [];
  return (
    <Skeleton>
      {user && (
        <AccountInner
          user={user}
          connectedSummoners={connected}
          refetch={connectedQ.refetch}
        />
      )}
    </Skeleton>
  );
}

export function AccountInner({
  user,
  connectedSummoners,
  refetch,
}: {
  user: UserType;
  connectedSummoners: SummonerType[];
  refetch: () => void;
}) {
  const [isShowConnect, setIsShowConnect] = useState(false);
  return (
    <>
      <div className="mx-auto max-w-prose">
        <div>
          <div className="font-bold">Email</div>
          <div className="w-full rounded-md border border-zinc-800 bg-zinc-800/30 p-2">
            {user.email}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-lg font-bold">Connected Summoners</div>
          <div className="flex flex-wrap">
            {connectedSummoners.map((x) => {
              return (
                <div
                  key={x.puuid}
                  className="m-2 flex w-64 rounded-md border border-zinc-800 bg-zinc-800/30 p-3"
                >
                  <ConnectedCard summoner={x} onUnlink={refetch} />
                </div>
              );
            })}
          </div>
          {isShowConnect ? (
            <ConnectAccount onSuccess={() => refetch()} />
          ) : (
            <button
              onClick={() => setIsShowConnect(true)}
              className="btn btn-default mt-3 w-full"
            >
              Connect New Summoner
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function ConnectedCard({
  summoner,
  onUnlink,
}: {
  summoner: SummonerType;
  onUnlink: () => void;
}) {
  const [isConfirm, setIsConfirm] = useState(false);
  const unlink = useMutation({
    mutationFn: () => api.player.unlinkAccount(summoner.puuid),
    onSuccess: () => onUnlink(),
  });
  return (
    <div className="mx-auto">
      <div className="flex">
        <Image
          className="h-[40px] w-[40px] rounded-md"
          width={40}
          height={40}
          src={mediaUrl(summoner.profile_icon)}
          alt={`Profile Icon ${summoner.profile_icon_id}`}
        />
        <div className="my-auto h-full">
          <div className="mx-2 rounded-lg border border-zinc-800 bg-black/20 px-2 py-1">
            {summoner.region}
          </div>
        </div>
        <div className="my-auto h-full">{summoner.riot_id_name}#{summoner.riot_id_tagline}</div>
      </div>
      <div>Level: {summoner.summoner_level}</div>
      <div>
        {!isConfirm ? (
          <button
            onClick={() => setIsConfirm(true)}
            className="btn btn-primary w-full"
          >
            Unlink Account
          </button>
        ) : (
          <div>
          <div className="rounded-md bg-red-600/50 p-2 my-2 font-bold">Are you sure?</div>
            <div className="flex">
            <button
              onClick={() => unlink.mutate()}
              className={clsx("btn btn-primary w-1/2 mr-1", {
                disabled: unlink.isPending,
              })}
            >
              Unlink
            </button>
            <button
              onClick={() => setIsConfirm(false)}
              className="btn btn-default w-1/2 ml-1"
            >
              Cancel
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectAccount({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("na");
  const mutation = useMutation({
    mutationFn: ({ simpleRiotId, region }: { simpleRiotId: string; region: string }) =>
      api.player
        .generateCode({ action: "create", simple_riot_id: simpleRiotId, region })
        .then((response) => response.data),
  });

  const connect = useMutation({
    mutationFn: () =>
      api.player
        .connectAccountWithProfileIcon({
          simple_riot_id: mutation.data.simple_riot_id,
          region,
        })
        .then((r) => r.data),
    onSuccess: () => onSuccess(),
  });

  function isInvalid(name: string) {
    const count = name.split('#').length - 1
    if (count !== 1) {
      return "There must be one '#' between your Riot ID and Tagline."
    }
    return false
  }

  return (
    <>
      <div className="mt-5">
        <div className="text-lg font-bold">Add Summoner Account</div>
        <hr />
        {!mutation.data && (
          <>
            <div className="mt-2">
              <label>
                <div className="font-bold">Region</div>
                <select
                  className="h-8 w-full"
                  name="region"
                  onChange={(event) => setRegion(event.currentTarget.value)}
                >
                  {REGIONS.map((x) => {
                    return (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="mt-2">
                <div className="font-bold">Riot ID & Tagline (your-name#tagline)</div>
                <input
                  className="w-full"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
                {name.length > 0 && isInvalid(name) &&
                  <ErrorField message={isInvalid(name) || ""}/>
                }
              </label>
            </div>
            <div>
              <button
                onClick={() => mutation.mutate({ simpleRiotId: name, region })}
                className={clsx("btn btn-default mt-2 w-full", {
                  disabled: mutation.isPending,
                })}
              >
                Generate Connection Code
              </button>
            </div>
          </>
        )}
      </div>

      {mutation.data && (
        <div className="mt-2">
          <div className="rounded-md bg-teal-900/80 p-2 shadow-md">
            Set your profile icon to this icon and click
            <span className="mx-1 font-extrabold">verify account</span>
            to link your accounts.
          </div>

          <div className="my-2">
            This is just temporary, you can change your profile icon back after
            you are finished.
          </div>
          <div className="flex">
            <div className="mx-auto my-3 flex flex-col">
              <Image
                src={mediaUrl(mutation.data.icon.image_url)}
                width={60}
                height={60}
                alt={`Icon ID: ${mutation.data.icon.id}`}
              />
              <div className="font-bold">{mutation.data.simple_riot_id}</div>
            </div>
          </div>
          <div>
            <button
              onClick={() => connect.mutate()}
              className={clsx("btn btn-default mt-2 w-full", {
                disabled: connect.isPending,
              })}
            >
              Verify Account
            </button>
          </div>

          {connect.data && (
            <>
              {connect.data.success === false && (
                <div className="mt-2 rounded-md bg-red-900/70 p-2">
                  {connect.data.message ||
                    "There was an error linking your account."}
                </div>
              )}
              {connect.data.success === true && (
                <div className="mt-2 rounded-md bg-teal-900/80 p-2">
                  Successfully linked accounts! Refresh if you&apos;d like to
                  connect another.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
