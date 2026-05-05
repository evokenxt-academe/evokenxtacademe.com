import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StreamStatsCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    text: string;
  };
  icon?: React.ReactNode;
}

export function StreamStatsCard({
  label,
  value,
  trend,
  icon,
}: StreamStatsCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        <div className="text-3xl font-bold mb-2">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }
            >
              {trend.text}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
