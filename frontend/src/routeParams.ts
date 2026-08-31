import { z } from "zod";

export const searchNameParamsSchema = z
  .object({ searchName: z.string() })
  .transform(
    ({
      searchName,
    }): {
      riot_id_name?: string;
      riot_id_tagline?: string;
    } => {
      const [riot_id_name = "", riot_id_tagline = ""] = searchName.split("-");
      return { riot_id_name, riot_id_tagline };
    },
  );
