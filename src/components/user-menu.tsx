'use client'

import { User, LogOut, ShoppingBag, LayoutDashboard, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  } | null
  loading: boolean
  isAdmin: boolean
  onLogout: () => void
}

export function UserMenu({ user, loading, isAdmin, onLogout }: UserMenuProps) {
  const router = useRouter()

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="hidden md:flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    // User not logged in - show login link that navigates directly to login page
    return (
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex items-center gap-2"
        onClick={() => router.push('/login')}
      >
        <User className="w-5 h-5" />
      </Button>
    )
  }

  // User is logged in - show dropdown menu with options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden md:flex items-center gap-2">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="w-4 h-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
            <ShoppingBag className="w-4 h-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
