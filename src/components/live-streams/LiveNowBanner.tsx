import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import Link from "next/link";

interface LiveStream {
  id: string;
  title: string;
  startedAt: string;
  currentViewers: number;
}

interface LiveNowBannerProps {
  streams: LiveStream[];
}

export function LiveNowBanner({ streams }: LiveNowBannerProps) {
  if (streams.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 mb-6">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="font-semibold text-red-900">
              {streams.length} stream{streams.length !== 1 ? "s" : ""} LIVE now
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => (
            <Card key={stream.id} className="bg-white">
              <CardContent className="p-4">
                <div className="mb-3">
                  <Badge className="bg-red-600 hover:bg-red-700 mb-2">
                    LIVE
                  </Badge>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                    {stream.title}
                  </h4>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <p>
                    {(stream.currentViewers || 0).toLocaleString()} viewer
                    {stream.currentViewers !== 1 ? "s" : ""}
                  </p>
                  {stream.startedAt && isValid(new Date(stream.startedAt)) && (
                    <p>
                      {formatDistanceToNow(new Date(stream.startedAt), {
                        addSuffix: false,
                      })}{" "}
                      elapsed
                    </p>
                  )}
                </div>

                <Button asChild variant="default" size="sm" className="w-full">
                  <Link href={`/admin/live-streams/${stream.id}`}>
                    Control Center
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
