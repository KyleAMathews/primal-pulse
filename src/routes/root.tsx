import { Outlet, NavLink, Link } from "react-router-dom"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"
import { Flex, Box, Text, Heading } from "@radix-ui/themes"
import { useConnectivityState } from "electric-sql/react"

const ConnectivityIcon = ({ connected }) => {
  const iconStyle = {
    width: `15px`,
    height: `15px`,
    borderRadius: `50%`,
    background: connected
      ? `radial-gradient(circle, rgba(0,255,0,1) 0%, rgba(0,200,0,1) 70%, rgba(0,150,0,1) 100%)`
      : `radial-gradient(circle, rgba(255,165,0,1) 0%, rgba(200,100,0,1) 70%, rgba(150,50,0,1) 100%)`,
    boxShadow: connected
      ? `0 0 10px rgba(0, 255, 0, 0.5)`
      : `0 0 10px rgba(255, 165, 0, 0.5)`,
    border: `2px solid`,
    borderColor: connected ? `rgba(0, 255, 0, 0.8)` : `rgba(255, 165, 0, 0.8)`,
  }

  return <div style={iconStyle}></div>
}

export default function Root() {
  const { connectivityState } = useConnectivityState()
  console.log({ connectivityState })
  return (
    <Flex direction="column" style={{ margin: `0 auto`, minHeight: `100%` }}>
      <Flex asChild align="center" p="3" justify="between">
        <header>
          <Flex align="center" gap="3">
            <ConnectivityIcon connected={connectivityState === `connected`} />
            <Heading size="2" weight="bold" trim="normal">
              <NavLink to="/" style={{ textDecoration: `none` }}>
                Primal Pulse
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
