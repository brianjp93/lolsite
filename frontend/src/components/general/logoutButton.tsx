import api from "@/external/api/api.ts";
import { useMutation } from "@tanstack/react-query";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const logout = useMutation({
    mutationFn: () => api.player.logout(),
    onSuccess: () => window.location.reload(),
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
