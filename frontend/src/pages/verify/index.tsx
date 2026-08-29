import {useQuery} from "@tanstack/react-query"
import {useRouter} from "@/compat/router"
import api from '@/external/api/api'
import Skeleton from "@/components/general/skeleton"
import { Link } from "@tanstack/react-router"
import {loginPath} from "../login"

export default function Verify() {
  const router = useRouter()
  const query = router.query as {code?: string}
  const code = query?.code

  const verifyQ = useQuery({
    queryKey: ['verify'],
    queryFn: () => api.player.verify(code || ""),
    enabled: !!code,
    retry: false,
  })

  return (
    <Skeleton>
      {verifyQ.isPending &&
        <div>
          Verifying your email...
        </div>
      }
      {verifyQ.isSuccess &&
        <div>
          Email verified! Please
          <Link className="btn btn-link ml-1 inline" to={loginPath()}>Log In</Link>.
        </div>
      }
      {verifyQ.isError &&
        <div>
          There was an issue while verifying your email. It may have already
          been verified.  Try to log in, or request a new verification email.
        </div>
      }
    </Skeleton>
  )
}
