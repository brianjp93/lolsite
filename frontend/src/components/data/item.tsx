import { useSimpleItem } from "@/hooks";
import { itemHistoryRoute } from "@/routes";
import { useState } from "react";
import { Popover } from "react-tiny-popover";

function cleanItemDescription(html: string): string {
  return html
    .replace(/<stats><\/stats>/gi, "")
    .replace(/<maintext>(\s*<br\s*\/?>\s*)+/gi, "<maintext>");
}

export function Item(props: any) {
  return (
    <div className="rounded-lg bg-zinc-800/95 p-3 shadow-xl backdrop-blur-sm">
      {props.item === null && (
        <span className="text-sm text-zinc-400">Retrieving item...</span>
      )}
      {props.item !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <a href={itemHistoryRoute(props.item._id)}>
              <span className="font-semibold text-white underline decoration-zinc-500 hover:decoration-white">
                {props.item.name}
              </span>
            </a>
            <span className="font-bold text-yellow-400">
              {props.item.gold.total}g
            </span>
          </div>
          <div className="border-t border-zinc-700 pt-2">
            <div
              className="text-xs leading-relaxed text-zinc-300"
              dangerouslySetInnerHTML={{
                __html: cleanItemDescription(props.item.description),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ItemPopover({
  major,
  minor,
  item_id,
  style,
  children,
}: React.PropsWithChildren<any>) {
  const [isOpen, setIsOpen] = useState(false);
  const query = useSimpleItem({ id: item_id, major, minor });
  const item = query.data;

  const toggle = () => setIsOpen((x) => !x);

  if (item_id) {
    return (
      <Popover
        onClickOutside={() => setIsOpen(false)}
        isOpen={isOpen}
        positions={["top"]}
        containerStyle={{ zIndex: "11", padding: "0" }}
        content={<Item item={item} />}
      >
        <div
          tabIndex={1}
          role="button"
          onKeyDown={(event) => (event.key === "Enter" ? toggle() : null)}
          style={{ ...style, cursor: "pointer" }}
          onClick={toggle}
        >
          {children}
        </div>
      </Popover>
    );
  } else {
    return <div style={style}>{children}</div>;
  }
}
