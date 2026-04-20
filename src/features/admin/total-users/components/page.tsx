"use client"
import { UsersList } from "@/features/admin/total-users/components/users-litst";
import { columns, Users } from "@/features/admin/total-users/components/colums"
import { useQuery } from "@tanstack/react-query";

export function UsersPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/admin/list-users");
            const json = await res.json();
            return json;
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    })
    return (
        <div className="container mx-auto py-5">
            <UsersList columns={columns} data={data?.users as Users[] ?? []} isLoading={isLoading} />

        </div>
    )
}
