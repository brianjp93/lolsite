import { SearchForm } from "@/components/general/searchForm";

export default function SummonerNotFound() {
  return (
    <div>
      <div className="row">
        <div
          className="col m6 offset-m3"
          style={{
            marginTop: 50,
            textAlign: "center",
          }}
        >
          <h3>
            <em>* spam pings ? *</em>
          </h3>
          <div>That summoner couldn&apos;t be found for this region.</div>
          <div>
            There may have been an internal error, or Riot&apos;s API may be
            down. Please come back later and check
            <a href="https://developer.riotgames.com/api-status/"> here </a>
            for Riot&apos;s API status.
          </div>

          <div className="mt-[50px]">
            <SearchForm />
          </div>
        </div>
      </div>
    </div>
  );
}
