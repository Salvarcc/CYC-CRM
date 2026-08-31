import { Card, CardContent, CardHeader } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

export interface StatCardProps {
  id: string;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}

export function StatCard({ label, value, iconBg, iconColor, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            iconBg,
            iconColor,
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="mt-6 p-0">
        <div className="mb-1.25 text-xl leading-7 font-semibold text-text-primary md:text-2xl md:leading-8">
          {value}
        </div>
      </CardContent>
      <div className="flex items-center justify-between p-0">
        <span className="text-sm leading-5 font-medium text-text-tertiary">
          {label}
        </span>
      </div>
    </Card>
  );
}