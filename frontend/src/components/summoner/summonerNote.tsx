import type { SummonerType } from "@/external/types";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/external/api/api";
import { PencilIcon } from "@/components/icons";
import { useUser } from "@/hooks";

export function SummonerNote({ summoner }: { summoner: SummonerType }) {
  const [viewState, setViewState] = useState<"view" | "edit">("view");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (note: string) =>
      api.player.saveSummonerNote({ summoner_id: summoner.id, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summoner"] });
      setViewState("view");
    },
  });

  const onEdit = () => {
    setViewState("edit");
  };

  const onCancel = () => {
    setViewState("view");
  };

  const onSave = (note: string) => {
    mutation.mutate(note);
  };

  const view = () => {
    if (viewState === "view") {
      return <SummonerNoteView summoner={summoner} onEdit={onEdit} />;
    }
    return (
      <SummonerNoteEdit
        summoner={summoner}
        onCancel={onCancel}
        onSave={onSave}
        isLoading={mutation.isPending}
      />
    );
  };

  return (
    <div className="ml-4 flex h-auto min-h-[200px] w-96 max-w-full flex-col rounded bg-zinc-900 p-4 shadow-lg">
      {view()}
    </div>
  );
}

function SummonerNoteEdit({
  summoner,
  onCancel,
  onSave,
  isLoading,
}: {
  summoner: SummonerType;
  onCancel: () => void;
  onSave: (note: string) => void;
  isLoading: boolean;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when entering edit mode
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      // place cursor at end
      textAreaRef.current.selectionStart = textAreaRef.current.value.length;
      textAreaRef.current.selectionEnd = textAreaRef.current.value.length;
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 text-sm font-bold text-zinc-400">Editing Note</div>
      <textarea
        className="textarea mb-2 w-full flex-1 resize-none border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500"
        name="summoner-note"
        ref={textAreaRef}
        defaultValue={summoner.notes?.note || ""}
        disabled={isLoading}
        placeholder="Add a note about this summoner..."
      />
      <div className="flex justify-end gap-2">
        <button
          className="btn btn-sm btn-ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            if (textAreaRef.current) {
              onSave(textAreaRef.current.value);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function SummonerNoteView({
  summoner,
  onEdit,
}: {
  summoner: SummonerType;
  onEdit: () => void;
}) {
  const userQuery = useUser();
  const canEdit = userQuery.data;

  return (
    <div className="group relative flex h-full flex-col transition-colors">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold text-zinc-400">Notes</div>
        <button
          className="btn btn-xs btn-ghost text-zinc-500 hover:text-zinc-200"
          onClick={() => canEdit && onEdit()}
          title="Edit Note"
        >
          <PencilIcon className="w-4" />
        </button>
      </div>
      {summoner.notes?.note ? (
        <div className="max-h-32 flex-1 overflow-y-auto whitespace-pre-wrap text-sm">
          {summoner.notes.note}
        </div>
      ) : (
        <div
          className="flex-1 cursor-pointer text-sm italic text-zinc-500 hover:text-zinc-400"
          tabIndex={1}
          role="button"
          onClick={() => canEdit && onEdit()}
        >
          {canEdit ? (
            <>No notes for this summoner. Click to add one.</>
          ) : (
            <>Log in to save notes on this summoner.</>
          )}
        </div>
      )}
    </div>
  );
}
