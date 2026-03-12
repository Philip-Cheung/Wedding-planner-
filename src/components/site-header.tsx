import { format } from 'date-fns'
import { FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useWedding } from '@/features/wedding/WeddingContext'

export function SiteHeader() {
  const { wedding, loading } = useWedding()

  const subtitle = wedding
    ? [
        wedding.partner_name && `with ${wedding.partner_name}`,
        wedding.wedding_date &&
          format(new Date(wedding.wedding_date), 'MMMM d, yyyy'),
        wedding.location_city,
      ]
        .filter(Boolean)
        .join(' • ')
    : null

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : (
            <div className="min-w-0 truncate">
              <h1 className="truncate text-base font-medium">
                {wedding?.wedding_name || 'Wedding Planner'}
              </h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
