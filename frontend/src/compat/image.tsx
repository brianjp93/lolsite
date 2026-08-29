import type { ComponentProps } from "react";

type Props = ComponentProps<"img"> & {
  priority?: boolean;
};

export default function Image({ priority, ...props }: Props) {
  return <img loading={priority ? "eager" : "lazy"} {...props} />;
}
