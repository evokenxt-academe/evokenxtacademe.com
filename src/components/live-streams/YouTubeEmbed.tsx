import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { IconBrandYoutube } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

interface YouTubeEmbedProps {
  videoId?: string;
  streamStatus: "scheduled" | "live" | "ended" | "cancelled";
}

export function YouTubeEmbed({ videoId, streamStatus }: YouTubeEmbedProps) {
  const [copied, setCopied] = useState(false);

  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";

  const handleCopyLink = () => {
    if (watchUrl) {
      navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      toast.success("Watch link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!videoId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <IconBrandYoutube className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Broadcast not created yet
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            YouTube broadcast will be created when you proceed through the setup
            wizard
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
            title="YouTube Live Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(watchUrl, "_blank")}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Watch on YouTube
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
