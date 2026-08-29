import api from "@/external/api/api.ts";
import { useUser } from "@/hooks";
import { useMutation } from "@tanstack/react-query";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const userQuery = useUser();
  const logout = useMutation({
    mutationFn: () => api.player.logout(),
    onSuccess: () => userQuery.refetch(),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => logout.mutate()}
        className={`btn btn-default ${className}`}
      >
        logout
      </button>
    </>
  );
}
