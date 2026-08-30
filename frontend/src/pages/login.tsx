import Skeleton from "@/components/general/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorField } from "@/components/utils";
import api from "@/external/api/api";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { signUpRoute } from "@/routes";
import axios from "axios";

export function loginPath() {
  return "/login";
}

export default function Login() {
  return (
    <Skeleton>
      <LoginInner />
    </Skeleton>
  );
}

const LoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
type LoginSchema = z.infer<typeof LoginSchema>;

function LoginInner() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(LoginSchema),
  });

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.player.login({ email, password }),
    onSuccess: async () => {
      window.location.href = '/';
    },
  });
  const onSubmit = async ({ email, password }: LoginSchema) => {
    try {
      await login.mutateAsync({ email, password });
    } catch (error) {
      const validationErrors = axios.isAxiosError<
        Partial<Record<keyof LoginSchema, string[]>>
      >(error)
        ? error.response?.data
        : undefined;
      const emailError = validationErrors?.email?.[0];
      const passwordError = validationErrors?.password?.[0];

      if (emailError) setError("email", { message: emailError });
      if (passwordError) setError("password", { message: passwordError });
      if (!emailError && !passwordError) {
        setError("password", { message: "Unable to log in." });
      }
    }
  };
  return (
    <div className="mx-auto mt-11 flex w-full max-w-prose flex-col gap-y-4">
      <div className="w-full text-xl font-bold underline">Login</div>
      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
        <label>
          <div>email</div>
          <input className="w-full" type="text" {...register("email")} />
        </label>
        <ErrorField message={errors.email?.message} />
        <label>
          <div>password</div>
          <input
            autoComplete="off"
            className="w-full"
            type="password"
            {...register("password")}
          />
        </label>
        <ErrorField message={errors.password?.message} />
        <button type="submit" className="btn btn-primary mt-2 w-full">
          Login
        </button>
      </form>

      <div className="mt-3 flex">
        <div className="my-auto text-lg">No account?</div>
        <Link className="btn btn-link ml-2 inline" to={signUpRoute()}>
          Sign Up
        </Link>
      </div>
    </div>
  );
}
