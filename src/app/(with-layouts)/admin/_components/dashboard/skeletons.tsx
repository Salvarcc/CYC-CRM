import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border-secondary ${className ?? ""}`} />;
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <SkeletonPulse className="size-8 rounded-lg" />
          </CardHeader>
          <CardContent className="mt-6 p-0">
            <SkeletonPulse className="mb-1.5 h-7 w-24" />
          </CardContent>
          <div className="flex items-center justify-between p-0">
            <SkeletonPulse className="h-4 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function RecentQuotesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonPulse className="h-5 w-44" />
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryAlertsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonPulse className="h-5 w-40" />
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <SkeletonPulse className="h-4 w-40" />
              <SkeletonPulse className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}