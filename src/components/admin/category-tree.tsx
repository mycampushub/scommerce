'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChevronRight,
  ChevronDown,
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  children?: CategoryNode[]
  _count: {
    products: number
  }
}

interface CategoryTreeProps {
  categories: CategoryNode[]
  level?: number
  onAdd?: (parentId?: string) => void
  onEdit?: (category: CategoryNode) => void
  onDelete?: (category: CategoryNode) => void
  onToggleStatus?: (category: CategoryNode) => void
}

export function CategoryTree({
  categories,
  level = 0,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryTreeProps) {
  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          level={level}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  )
}

function CategoryTreeNode({
  category,
  level,
  onAdd,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  category: CategoryNode
  level: number
  onAdd?: (parentId?: string) => void
  onEdit?: (category: CategoryNode) => void
  onDelete?: (category: CategoryNode) => void
  onToggleStatus?: (category: CategoryNode) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group ${
          level > 0 ? 'ml-6' : ''
        }`}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6 h-6 shrink-0" />
        )}

        {/* Category Info */}
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
          {category.name.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-gray-900 truncate">
              {category.name}
            </p>
            {!category.isActive && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Inactive
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{category.slug}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {category._count.products} products
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdd?.(category.id)}
            title="Add Sub-category"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus?.(category)}>
                {category.isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(category)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          <CategoryTree
            categories={category.children!}
            level={level + 1}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        </div>
      )}
    </div>
  )
}

// Build tree structure from flat array
export function buildCategoryTree(flatCategories: CategoryNode[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>()
  const rootCategories: CategoryNode[] = []

  // Create map
  flatCategories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Build tree
  flatCategories.forEach((category) => {
    const node = categoryMap.get(category.id)!
    if (category.parentId && categoryMap.has(category.parentId)) {
      const parent = categoryMap.get(category.parentId)!
      parent.children!.push(node)
    } else {
      rootCategories.push(node)
    }
  })

  // Sort by sortOrder
  const sortCategories = (cats: CategoryNode[]) => {
    cats.sort((a, b) => a.sortOrder - b.sortOrder)
    cats.forEach((cat) => {
      if (cat.children && cat.children.length > 0) {
        sortCategories(cat.children)
      }
    })
  }

  sortCategories(rootCategories)

  return rootCategories
}
