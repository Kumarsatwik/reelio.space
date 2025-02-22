"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  Compass,
  Clock,
  ThumbsUp,
  PlaySquare,
  Film,
  Upload,
  Video,
  LogOut,
  Lock,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import React from "react";

export default function Sidebar() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout on error
      useAuthStore.getState().setUser(null);
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      router.push("/login");
    }
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  // if (!isAuthenticated || !user) {
  //   return null; // Don't render sidebar if not authenticated
  // }

  return (
    <aside className="w-64 bg-white border-r overflow-y-auto">
      <nav className="p-4 space-y-2">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Compass className="mr-2 h-4 w-4" />
            Explore
          </Button>
        </Link>

        {isAuthenticated ? (
          <>
            <Separator className="my-4" />
            {/* <Button variant="ghost" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              History
            </Button>

            <Button variant="ghost" className="w-full justify-start">
              <ThumbsUp className="mr-2 h-4 w-4" />
              Liked Videos
            </Button> */}

            <Link href="/videos">
              <Button variant="ghost" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                Your Videos
              </Button>
            </Link>

            {/* <Button variant="ghost" className="w-full justify-start">
              <Film className="mr-2 h-4 w-4" />
              Watch Later
            </Button> */}

            <Link href="/upload">
              <Button variant="ghost" className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>

            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>

            <Button
              className="w-full justify-start bg-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button className="w-full justify-start">
                <Lock className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
