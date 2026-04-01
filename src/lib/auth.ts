import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { magicLink } from "better-auth/plugins";
import { sendEmail } from "./brevo";
import { sql } from "drizzle-orm/sql/sql";
import { customSessionClient } from "better-auth/client/plugins";


export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),

    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "email-password"],
            allowDifferentEmails: false,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
                input: false,
            },
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    plugins: [
        magicLink({
            expiresIn: 10 * 60, // 10 minutes
            allowedAttempts: 3,

            sendMagicLink: async ({ email, token, url }, ctx) => {
                const isExistEmail = await db.select().from(schema.verification).where(sql`value::jsonb->>'email' = ${email}`)
                console.log("isExistEmail", isExistEmail);
                console.log(token, url);
                if (isExistEmail.length > 2) {
                    throw new APIError("BAD_REQUEST", { message: "Too many attempts. Please try again later." })
                }
                console.log(token, url);
                sendEmail({
                    subject: "Verify the sign in to your account",
                    meta: {
                        title: `Your link - ${process.env.BETTER_AUTH_URL}/verify-email?${url.split("?")[1]} (expires in 10 minutes)`,
                    },
                    to: {
                        email: email,
                        name: ctx?.body.name || "User",

                    }
                })
            }
        }),
        // TODO: add custom session client to include user role in the session data
        // customSessionClient(async ({ user, session }) => {
        //     return {
        //         user: {
        //             ...user,
        //             role: user.role!
        //         },
        //         session: {
        //             id: session.id, id: session.session.id,
        //             token: session.session.token,
        //             userId: session.session.userId,
        //             createdAt: session.session.createdAt,
        //             expiresAt: session.session.expiresAt,
        //         }
        //     }
        // }
        // )
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24,
        deferSessionRefresh: true,
        additionalFields: {
            role: {
                type: "string"
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {

                    const admins = process.env.NEXT_PUBLIC_ADMINS_EMAILS!
                        .split(";")
                        .map(e => e.trim().toLowerCase());
                    if (admins.includes(user.email.toLowerCase())) {
                        return {
                            data: {
                                ...user,
                                role: "ADMIN"
                            },
                        };
                    }
                    return { data: user }
                }
            }
        }
    }

});