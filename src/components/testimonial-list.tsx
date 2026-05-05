"use client";
import {
  Testimonial,
  TestimonialAuthor,
  TestimonialAuthorName,
  TestimonialAuthorTagline,
  TestimonialAvatar,
  TestimonialAvatarImg,
  TestimonialAvatarRing,
  TestimonialQuote,
} from "@/components/ui/testimonial";
import type { HTMLAttributes } from "react";
import type { MarqueeProps as FastMarqueeProps } from "react-fast-marquee";
import FastMarquee from "react-fast-marquee";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

type Position = {
  x: number;
  y: number;
};

const SPOTLIGHT_OPACITY = 0.5;

export type TestimonialSpotlightProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  | "children"
  | "onFocus"
  | "onBlur"
  | "onMouseEnter"
  | "onMouseLeave"
  | "onMouseMove"
> & {
  children: React.ReactNode;
  /** The color of the spotlight effect.
   * @defaultValue "rgba(255,255,255,0.2)"
   */
  spotlightColor?: string;
  /**
   * The opacity of the spotlight effect.
   * @defaultValue 0.5
   */
  spotlightOpacity?: number;
  /**
   * The size of the spotlight effect.
   * @defaultValue "60%"
   */
  spotlightSize?: string;
};

export function TestimonialSpotlight({
  children,
  className,
  spotlightColor = "rgba(255,255,255,0.2)",
  spotlightOpacity = SPOTLIGHT_OPACITY,
  spotlightSize = "60%",
  ...props
}: TestimonialSpotlightProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [opacity, setOpacity] = useState<number>(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(spotlightOpacity);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(spotlightOpacity);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!itemRef.current || isFocused) return;

    const rect = itemRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={itemRef}
      data-slot="testimonial-spotlight"
      className={cn(
        "relative overflow-hidden rounded-xl bg-card/50 ring-1 ring-foreground/10 ring-inset",
        className,
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, var(--spotlight-color, ${spotlightColor}), transparent var(--spotlight-size, ${spotlightSize}))`,
        }}
      />
      {children}
    </div>
  );
}

export type MarqueeProps = HTMLAttributes<HTMLDivElement>;

export const Marquee = ({ className, ...props }: MarqueeProps) => (
  <div
    className={cn("relative w-full overflow-hidden", className)}
    {...props}
  />
);

export type MarqueeContentProps = FastMarqueeProps;

export const MarqueeContent = ({
  loop = 0,
  autoFill = true,
  pauseOnHover = true,
  ...props
}: MarqueeContentProps) => (
  <FastMarquee
    autoFill={autoFill}
    loop={loop}
    pauseOnHover={pauseOnHover}
    {...props}
  />
);

export type MarqueeFadeProps = HTMLAttributes<HTMLDivElement> & {
  side: "left" | "right";
};

export const MarqueeFade = ({
  className,
  side,
  ...props
}: MarqueeFadeProps) => (
  <div
    className={cn(
      "absolute top-0 bottom-0 z-10 h-full w-24 from-background to-transparent",
      side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
      className,
    )}
    {...props}
  />
);

export type MarqueeItemProps = HTMLAttributes<HTMLDivElement>;

export const MarqueeItem = ({ className, ...props }: MarqueeItemProps) => (
  <div
    className={cn("mx-2 flex-shrink-0 object-contain", className)}
    {...props}
  />
);

export type TestimonialType = {
  /** URL to the person's profile picture or avatar image */
  authorAvatar: string;
  /** Full display name of the person giving the testimonial */
  authorName: string;
  /** Short tagline, title, or description of the person */
  authorTagline: string;
  /** Link to the person's profile, website, or social media page */
  url: string;
  /** The testimonial text content or recommendation message */
  quote: string;
};

export function TestimonialList({
  direction,
  data,
}: {
  direction?: "right" | "left";
  data: TestimonialType[];
}) {
  return (
    <Marquee>
      <MarqueeFade side="left" />
      <MarqueeFade side="right" />

      <MarqueeContent direction={direction}>
        {data.map((item, index) => (
          <MarqueeItem key={`${item.authorName}-${index}`} className="mx-1 h-full w-xs">
            <a
              className="block h-full"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TestimonialSpotlight className="h-full">
                <TestimonialItem {...item} />
              </TestimonialSpotlight>
            </a>
          </MarqueeItem>
        ))}
      </MarqueeContent>
    </Marquee>
  );
}

function TestimonialItem({
  authorAvatar,
  authorName,
  authorTagline,
  quote,
}: TestimonialType) {
  return (
    <Testimonial>
      <TestimonialQuote className="min-h-14">
        <p>{quote}</p>
      </TestimonialQuote>

      <TestimonialAuthor>
        <TestimonialAvatar>
          <TestimonialAvatarImg src={authorAvatar} alt={authorName} />
          <TestimonialAvatarRing />
        </TestimonialAvatar>

        <TestimonialAuthorName>{authorName}</TestimonialAuthorName>
        <TestimonialAuthorTagline>{authorTagline}</TestimonialAuthorTagline>
      </TestimonialAuthor>
    </Testimonial>
  );
}
