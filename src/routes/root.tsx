import { useState, useEffect } from "react"
import { Outlet, NavLink, Link } from "react-router-dom"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"
import { Flex, Box, Heading } from "@radix-ui/themes"
import { ConnectivityIcon } from "../components/connectivity-icon"
import { UpdateIcon } from "@radix-ui/react-icons"
import { useUser } from "@clerk/clerk-react"
import { lambdaFunction } from "../util"

export default function Root() {
  const [fetching, setFetching] = useState(false)
  const { user } = useUser()
  useEffect(() => {
    async function fetchActivities() {
      setFetching(true)
      await fetch(lambdaFunction + `?userId=${user.id}`)
      setFetching(false)
    }
    fetchActivities()
  }, [user])
  return (
    <Flex direction="column" style={{ margin: `0 auto`, minHeight: `100%` }}>
      <Flex asChild align="center" p="3" justify="between">
        <header>
          <Flex align="center" gap="3">
            <ConnectivityIcon />
            <Heading size="2" weight="bold" trim="normal">
              <NavLink to="/" style={{ textDecoration: `none` }}>
                <Heading>
                  Primal Pulse{` `}
                  {fetching && (
                    <UpdateIcon className="icon-spin" height="16" width="16" />
                  )}
                </Heading>
              </NavLink>
            </Heading>
          </Flex>
          <Flex>
            <SignedIn>
              <UserButton afterSignOutUrl="/sign-in" />
            </SignedIn>
            <SignedOut>
              <Link to="/sign-in">Sign In</Link>
            </SignedOut>
          </Flex>
        </header>
      </Flex>
      <Box asChild p="3" width="100%">
        <main>
          <Outlet />
        </main>
      </Box>
    </Flex>
  )
}
