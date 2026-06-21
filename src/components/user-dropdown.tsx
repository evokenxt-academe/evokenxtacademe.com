"use client";

import React from "react";
import Link from "next/link";
import { useUserSession } from "@/features/auth/store/use-user-session";
import { signOutUser } from "@/features/auth/lib/sign-out";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogOut,
  Settings,
  User,
  CreditCard,
  BookOpen,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
} from "lucide-react";

export function UserDropdown() {
  const { user, isLoading, getSession } = useUserSession();

  // Fetch session on mount if user is not loaded
  React.useEffect(() => {
    if (!user && !isLoading) {
      getSession();
    }
  }, []);

  const handleLogout = async () => {
    await signOutUser("/");
  };

  // Generate user initials for avatar fallback
  const getUserInitials = (): string => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "E";
  };

  // Loading state
  if (isLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} alt={user?.name || "User avatar"} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        {user ? (
          <AuthenticatedMenu user={user} onLogout={handleLogout} />
        ) : (
          <GuestMenu />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Authenticated user menu component
interface AuthenticatedMenuProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
  };
  onLogout: () => void;
}

function AuthenticatedMenu({ user, onLogout }: AuthenticatedMenuProps) {
  return (
    <>
      {/* User Info Header */}
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1.5">
          <p className="text-sm font-medium leading-none truncate">
            {user.name || "User"}
          </p>
          <p className="text-xs leading-none text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      {/* Main Navigation */}
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/my-courses">
            <BookOpen className="mr-2 h-4 w-4" />
            My Courses
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      {/* Admin Section */}
      {(user.role === "admin" || user.role === "instructor") && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )}

      {/* Billing Section */}
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      {/* Logout — only for admin/instructor */}
      {(user.role === "admin" || user.role === "instructor") && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

// Guest user menu component
function GuestMenu() {
  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1.5">
          <p className="text-sm font-medium leading-none">Welcome!</p>
          <p className="text-xs leading-none text-muted-foreground">
            Sign in to access your courses
          </p>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem asChild>
        <Link href="/auth/login">
          <LogIn className="mr-2 h-4 w-4" />
          Log in
        </Link>
      </DropdownMenuItem>
    </>
  );
}
