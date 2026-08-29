export default function Footer() {
  return (
    <div className="mt-auto">
      <div
        style={{
          paddingTop: 100,
          marginBottom: 50,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            left: 0,
          }}
        >
          <div
            style={{
              fontSize: "small",
              padding: "0px 15px 15px 15px",
            }}
          >
            <div>
              <em>Hardstuck.club</em> isn’t endorsed by Riot
              Games and doesn’t reflect the views or opinions of Riot Games or
              anyone officially involved in producing or managing League of
              Legends. League of Legends and Riot Games are trademarks or
              registered trademarks of Riot Games, Inc. League of Legends © Riot
              Games, Inc.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
