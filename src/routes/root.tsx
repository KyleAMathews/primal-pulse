import { Outlet, NavLink, Link } from "react-router-dom"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"
import { Flex, Box, Text, Heading } from "@radix-ui/themes"

export default function Root() {
  return (
    <Flex direction="column" style={{ margin: `0 auto`, minHeight: `100%` }}>
      <Flex asChild align="center" p="3" justify="between">
        <header>
          <Heading size="2" weight="bold" size="4" trim="normal">
            <NavLink to="/" style={{ textDecoration: `none` }}>
              Primal Pulse
            </NavLink>
          </Heading>
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
