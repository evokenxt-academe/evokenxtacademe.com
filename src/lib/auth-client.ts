import { createAuthClient } from "better-auth/react"
import { magicLinkClient } from "better-auth/client/plugins";
import { admin as adminPlugin } from "better-auth/plugins"
import { ac, admin, user } from "./permissions"

const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL! || "http://localhost:3000",
    plugins: [
        magicLinkClient(),
        adminPlugin({
            ac,
            roles: {
                admin,
                user,
            }
        }),


    ]
})

export const { magicLink, signIn, useSession, signOut } = authClient;