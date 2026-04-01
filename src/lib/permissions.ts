import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    course: ["create", "share", "update", "delete", "read"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
    course: ["share", "read"],
});

export const admin = ac.newRole({
    course: ["update", "delete", "create", "share"],
});