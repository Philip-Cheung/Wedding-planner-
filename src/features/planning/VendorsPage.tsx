import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Vendor = {
  id: string
  name: string
  category: string | null
  contract_status: string | null
  payment_status: string | null
  contact_person: string | null
  contact_info: string | null
  phone: string | null
  email: string | null
}

export function VendorsPage() {
  const { user } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
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

      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('wedding_id', w.id)
        .order('sort_order')

      setVendors(data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Vendor tracker</h2>
        <p className="text-muted-foreground">
          Track vendors, contracts, and payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>
            {vendors.length === 0
              ? 'No vendors yet. Add your first vendor to get started.'
              : `${vendors.length} vendor${vendors.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No vendors yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.category ?? '—'}</TableCell>
                    <TableCell>{v.contract_status ?? '—'}</TableCell>
                    <TableCell>{v.payment_status ?? '—'}</TableCell>
                    <TableCell>
                      {v.contact_person ?? v.email ?? v.phone ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
