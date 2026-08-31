import assert from "node:assert/strict";
import { searchNameParamsSchema } from "./routeParams.ts";

assert.deepEqual(searchNameParamsSchema.parse({ searchName: "Player-NA1" }), {
  riot_id_name: "Player",
  riot_id_tagline: "NA1",
});
assert.deepEqual(searchNameParamsSchema.parse({ searchName: "Player" }), {
  riot_id_name: "Player",
  riot_id_tagline: "",
});
