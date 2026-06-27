"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { extractYoutubeVideoId } from "@/features/live-stream/lib";
import type { LiveStreamSummary } from "@/features/live-stream/types";
import {
  IconBroadcast,
  IconLoader2,
} from "@tabler/icons-react";

type LiveVideoPanelProps = {
  stream: LiveStreamSummary;
  courseName: string;
};

export function LiveVideoPanel({ stream, courseName }: LiveVideoPanelProps) {

  const isLive = stream.status === "live";

  const isScheduled = stream.status === "scheduled";

  const videoId = extractYoutubeVideoId(stream.ytVideoId ?? "");

  const playerKey = `${stream.id}-${stream.status}-${videoId || "pending"}`;

  const [reloadToken] = React.useState(0);



  return (

    <Card className="overflow-hidden border-border/70 shadow-sm">

      <CardHeader className="border-b border-border/60 bg-muted/20 py-3.5 px-4 sm:px-5">

        <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">

          {stream.title}

        </CardTitle>

      </CardHeader>



      <CardContent className="p-0">

        {isScheduled ? (

          <div className="relative flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-muted/40 to-muted/10 px-6 text-center">

            <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">

              <IconBroadcast className="size-7 text-red-600 animate-pulse" />

            </div>

            <div className="max-w-md space-y-2">

              <p className="text-base font-semibold">Waiting for the instructor to go live</p>

              <p className="text-sm text-muted-foreground">

                Keep this page open — playback will begin automatically when the broadcast starts.

              </p>

            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">

              <IconLoader2 className="size-3.5 animate-spin" />

              Listening for live status…

            </div>

          </div>

        ) : videoId ? (

          <div className="relative aspect-video bg-black overflow-hidden select-none">

            <iframe

              key={`${playerKey}-${reloadToken}`}

              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${isLive ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}

              title="Live stream player"

              className="size-full border-0"

              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

              sandbox="allow-scripts allow-same-origin allow-presentation"

              allowFullScreen

            />



          </div>

        ) : (

          <div className="flex aspect-video items-center justify-center bg-muted/30 px-6 text-center">

            <div className="max-w-sm space-y-3">

              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border/70">

                <IconBroadcast />

              </div>

              <p className="text-sm font-medium">

                No YouTube video is attached to this stream yet.

              </p>

              <p className="text-sm text-muted-foreground">

                The instructor will start the broadcast shortly. This page will

                update automatically when the stream goes live.

              </p>

            </div>

          </div>

        )}

      </CardContent>

    </Card>

  );

}


