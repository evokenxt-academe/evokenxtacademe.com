"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, GraduationCap, MoreHorizontal, ShieldUser, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export type Users = {
    name: string
    role: "admin" | "student" | "instructor"
    email: string
    avatar: string,
    phone_no: number | null
    id?: string
}

function ActionsCell({ userId, role }: { userId: string; role: string }) {
    const supabase = createClient()
    const query = useQueryClient()


    const handleRoleChange = async (newRole: "student" | "instructor") => {

        console.log(userId)
        const { data, error } = await supabase.from("users").update({ role: newRole }).eq("id", userId).select("*").single()
        console.log({ data, error })

        if (error) {
            toast.error("Failed to update role")
            return
        }
        query.invalidateQueries({ queryKey: ["users"] })
        toast.success("Role updated successfully")
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-fit">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {role === "instructor" ? (

                        <DropdownMenuItem onClick={() => handleRoleChange("student")}>
                            <GraduationCap className="size-4" />
                            <span>Make Student</span>

                        </DropdownMenuItem>
                    ) : role === "student" ? (
                        <DropdownMenuItem onClick={() => handleRoleChange("instructor")}>
                            <ShieldUser className="size-4" />
                            <span>Make Instructor</span>

                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem disabled>
                            <ShieldUser className="size-4" />
                            <span>Self Admin</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                        <Eye className="size-4" />
                        View Profile
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu >


        </>
    )
}

export const columns: ColumnDef<Users>[] = [
    {
        accessorKey: "avatar",
        header: "Avatar",
        cell: ({ row }) => {
            const avatarUrl = row.getValue("avatar") as string
            const name = row.getValue("name") as string
            const initials = name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) ?? "?"
            return (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl} alt={name ?? "User avatar"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            )
        },
    },
    {
        accessorKey: "email",
        header: "Email",
        enableHiding: true,
    },
    {
        accessorKey: "id",
        header: "ID",
        enableHiding: true,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const name = row.getValue("name") as string
            const email = row.getValue("email") as string
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{name}</span>
                    <span className="text-sm text-muted-foreground">{email}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "role",
        header: "Role",
    },
    {
        accessorKey: "phone_no",
        header: "Phone no",
        cell: ({ row }) => {
            const phone_no = row.getValue("phone_no") as number | null
            return (
                <span>{phone_no ?? "N/A"}</span>
            )
        }
    },
    {
        header: "Options",
        id: "actions",
        cell: ({ row }) => {
            const user = row.original
            const role = row.getValue("role") as string
            const id = row.getValue("id") as string
            return <ActionsCell userId={id} role={role} />
        },
    },
]