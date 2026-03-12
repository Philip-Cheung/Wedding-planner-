import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type VisionBoardCategory = {
  id: string
  name: string
  sort_order: number
}

type VisionBoardItem = {
  id: string
  category_id: string
  title: string | null
  image_path: string | null
  notes: string | null
}

export function VisionBoardPage() {
  const { user } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<VisionBoardCategory[]>([])
  const [items, setItems] = useState<VisionBoardItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: weddings } = await supabase
        .from('weddings')
        .select('id')
        .or(`owner_user_id.eq.${user.id},co_planner_user_id.eq.${user.id}`)
        .limit(1)

      const w = weddings?.[0]
      if (!w) {
        setLoading(false)
        return
      }

      setWeddingId(w.id)

      const [catsRes, itemsRes] = await Promise.all([
        supabase
          .from('vision_board_categories')
          .select('*')
          .eq('wedding_id', w.id)
          .order('sort_order'),
        supabase.from('vision_board_items').select('*'),
      ])

      setCategories(catsRes.data ?? [])
      setItems(itemsRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!weddingId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No wedding found. Complete onboarding first.</p>
      </div>
    )
  }

  const itemsByCategory = categories.map((c) => ({
    category: c,
    items: items.filter((i) => i.category_id === c.id),
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Vision board</h2>
        <p className="text-muted-foreground">
          Organize inspiration by category with drag-and-drop images
        </p>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No categories yet</CardTitle>
            <CardDescription>
              Create categories to organize your wedding inspiration (e.g. Flowers, Venue, Dress).
              Add images to each category.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itemsByCategory.map(({ category, items: catItems }) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>
                  {catItems.length} item{catItems.length === 1 ? '' : 's'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {catItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No images yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                      >
                        {item.image_path ? 'Image' : item.title || 'Empty'}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
