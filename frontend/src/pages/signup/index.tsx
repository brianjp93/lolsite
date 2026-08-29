import Skeleton from "@/components/general/skeleton";
import { useGoogleRecaptchaSiteKey } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/external/api/api";
import { useMutation } from "@tanstack/react-query";
import { ErrorField } from "@/components/utils";
import Script from "@/compat/script";
import Orbit from "@/components/general/spinner";
import clsx from "clsx";
import { useState } from "react";

const SignUpSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
type SignUpSchema = z.infer<typeof SignUpSchema>;

export interface CustomWindow extends Window {
  grecaptcha: any;
}

declare let window: CustomWindow;

export default function SignUp() {
  const [complete, setComplete] = useState(false);

  return (
    <Skeleton>
      {complete ? (
        <SignUpComplete />
      ) : (
        <SignUpInner setComplete={setComplete} />
      )}
    </Skeleton>
  );
}

export function SignUpInner({
  setComplete,
}: {
  setComplete: (complete: boolean) => void;
}) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
    setError,
  } = useForm<SignUpSchema>({
    resolver: zodResolver(SignUpSchema),
  });

  const siteKeyQ = useGoogleRecaptchaSiteKey();
  const siteKey = siteKeyQ.data;

  const mutation = useMutation({
    mutationFn: ({
      email,
      password,
      token,
    }: SignUpSchema & { token: string }) =>
      api.player.signUp({ email, password, token }),
    onError: () => {
      setError("password", {
        message: "There was a problem while signing up.",
      });
    },
    onSuccess: () => {
      setComplete(true);
    },
  });

  if (siteKeyQ.isLoading) {
    return <Orbit className="mx-auto" />;
  }
  if (!siteKey) {
    return "Unable to load sign up, try again later.";
  }

  function onClick(e: any, callback: (token: string) => void) {
    e.preventDefault();
    return window.grecaptcha.enterprise.ready(async () => {
      const token = await window.grecaptcha.enterprise.execute(siteKey, {
        action: "LOGIN",
      });
      // IMPORTANT: The 'token' that results from execute is an encrypted response sent by
      // reCAPTCHA Enterprise to the end user's browser.
      // This token must be validated by creating an assessment.
      // See https://cloud.google.com/recaptcha-enterprise/docs/create-assessment
      callback(token);
    });
  }

  return (
    <form>
      <Script
        src={`https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`}
      />
      <div className="mx-auto max-w-prose">
        <h1 className="mt-20 underline">Sign Up</h1>
        <label className="mt-8">
          <div>Email</div>
          <input type="text" className="w-full" autoComplete='email' {...register("email")} />
          <ErrorField message={errors.email?.message} />
        </label>
        <label className="mt-2">
          <div>Password</div>
          <input type="password" className="w-full" {...register("password")} />
          <ErrorField message={errors.password?.message} />
        </label>

        <button
          type="submit"
          onClick={(event) => {
            onClick(event, (token) => {
              trigger().then((isOk) => {
                if (isOk) {
                  const values = getValues();
                  mutation.mutate({ ...values, token });
                }
              });
            });
          }}
          className={clsx("btn btn-primary mt-2 w-full", {
            disabled: mutation.isPending,
          })}
        >
          Sign Up
        </button>
      </div>
    </form>
  );
}

function SignUpComplete() {
  return (
    <div>
      Thanks for signing up. Please check your email to verify your account.
    </div>
  );
}
