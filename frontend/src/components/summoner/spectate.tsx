import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import type { ReactNode } from "react";
import Modal from "react-modal";
import numeral from "numeral";
import { formatDatetimeTime, mediaUrl } from "@/components/utils";
import Image from "@/compat/image";
import { Popover } from "react-tiny-popover";
import { SummonerSummary } from "./SummonerSummary";
import { useSpectate } from "@/hooks";
import { Link } from "@tanstack/react-router";

export function Spectate({
  region,
  puuid,
  queueConvert,
  closeModal,
}: {
  region: string;
  puuid: string;
  queueConvert: any;
  closeModal: () => void;
}) {
  const spectateQuery = useSpectate(region, puuid);
  const spectateData = spectateQuery.data || undefined;
  const [isHover, setIsHover] = useState<string | undefined>(undefined);

  const team100 = (spectateQuery.data?.participants || []).filter(
    (x) => x.teamId === 100,
  );
  const team200 = (spectateQuery.data?.participants || []).filter(
    (x) => x.teamId === 200,
  );

  const matchtime = useRef<HTMLElement>(null);

  const queue = useMemo(() => {
    if (spectateData === undefined) {
      return "";
    }
    try {
      return queueConvert[spectateData?.gameQueueConfigId].description;
    } catch (error) {
      return `Queue ${spectateData.gameQueueConfigId}`;
    }
  }, [spectateData, queueConvert]);

  const getTopSoloPosition = (positions: any) => {
    const top = null;
    if (positions !== null) {
      for (const pos of positions) {
        if (pos.queue_type === "RANKED_SOLO_5x5") {
          return pos;
        }
      }
    }
    return top;
  };

  const getGameTime = useCallback(() => {
    if (spectateData === undefined) {
      return "";
    }
    const now = new Date().getTime();
    const ms = now - spectateData.gameStartTime;
    const total_seconds = Math.round(ms / 1000);
    const minutes = Math.floor(total_seconds / 60);
    const seconds = total_seconds % 60;
    return `${numeral(minutes).format("0")}:${numeral(seconds).format("00")}`;
  }, [spectateData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (matchtime.current === null) {
        return;
      }
      matchtime.current.innerHTML = getGameTime();
    }, 1000);
    return () => {
      window.clearInterval(interval);
    };
  }, [getGameTime]);

  const participantLine = (part: any) => {
    const pos = getTopSoloPosition(part.positions);
    const champion = part.champion || {};
    const [name, tagline] = part.riotId.split("#");
    return (
      <div key={part.puuid}>
        <hr />
        <div className="flex h-24">
          <Image
            height={40}
            width={40}
            className="max-h-[40px] rounded-md"
            src={mediaUrl(champion.image?.file_40)}
            alt=""
          />
          <div className="ml-2">
            <small onMouseEnter={() => setIsHover(part.puuid)}>
              {puuid === part.puuid && (
                <span className="align-top font-bold">{part.riotId}</span>
              )}
              {puuid !== part.puuid && (
                <Popover
                  isOpen={part.puuid === isHover}
                  positions={["bottom", "top"]}
                  containerStyle={{
                    zIndex: "21",
                    minWidth: "750px",
                    maxHeight: "400px",
                    overflowY: "scroll",
                    overflowX: "hidden",
                  }}
                  content={
                    <div
                      className="w-full"
                      onMouseLeave={() => setIsHover(undefined)}
                    >
                      <SummonerSummary
                        riotIdName={name}
                        riotIdTagline={tagline}
                        region={region}
                      />
                    </div>
                  }
                >
                  <Link
                    className="cursor-pointer align-top hover:underline"
                    to="/puuid/$puuid"
                    params={{ puuid: part.puuid }}
                  >
                    {part.riotId}
                  </Link>
                </Popover>
              )}
            </small>{" "}
          </div>
          {pos !== null && (
            <div className="ml-auto text-right">
              <small className="pill dark">
                {pos.tier} {pos.rank}
              </small>
              <br />
              <small>
                {pos.wins}W / {pos.losses}L
              </small>
              <br />
              <small>{`${numeral(
                (pos.wins / (pos.wins + pos.losses)) * 100,
              ).format("0.0")}%`}</small>
            </div>
          )}
        </div>
      </div>
    );
  };
  const width = 700;
  if (spectateQuery.isLoading) {
    return <div style={{ width: width }}>LOADING...</div>;
  } else {
    if (spectateData) {
      return (
        <div style={{ width: width, margin: "0px auto" }}>
          <div
            style={{
              display: "inline-block",
              position: "fixed",
              top: 60,
              right: 60,
            }}
          >
            <button
              onClick={closeModal}
              className={`btn-floating btn-large red`}
            >
              <i className="material-icons">close</i>
            </button>
          </div>
          <h5 style={{ margin: 0, display: "inline-block" }}>{queue}</h5>{" "}
          <span style={{ float: "right", paddingRight: 40 }}>
            Match started at {formatDatetimeTime(spectateData.gameStartTime)} |{" "}
            <span
              style={{ width: 50, display: "inline-block" }}
              ref={matchtime}
            ></span>
          </span>
          <div className="mt-2 flex">
            <div style={{ width: 350 }}>
              {team100.map((part) => {
                return participantLine(part);
              })}
            </div>
            <div className="ml-2" style={{ width: 350 }}>
              {team200.map((part) => {
                return participantLine(part);
              })}
            </div>
          </div>
        </div>
      );
    } else {
      // not in a game
      return (
        <div style={{ width: width }}>
          <h5 style={{ margin: 0 }}>
            This summoner is not currently in a game.
          </h5>
        </div>
      );
    }
  }
}

export function SpectateModal({
  isSpectateModalOpen,
  setIsSpectateModalOpen,
  queueConvert,
  region,
  puuid,
  children,
}: {
  isSpectateModalOpen: boolean;
  setIsSpectateModalOpen: (x: boolean) => void;
  queueConvert: any;
  region: string;
  puuid: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Modal
        isOpen={isSpectateModalOpen}
        onRequestClose={() => setIsSpectateModalOpen(false)}
        ariaHideApp={false}
      >
        <Spectate
          closeModal={() => setIsSpectateModalOpen(false)}
          queueConvert={queueConvert}
          region={region}
          puuid={puuid}
        />
      </Modal>
      <span
        style={{ cursor: "pointer" }}
        onClick={() => setIsSpectateModalOpen(true)}
      >
        {children}
      </span>
    </div>
  );
}
