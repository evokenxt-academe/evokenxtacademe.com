export interface NavItem {
  title: string;
  href: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    group: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    group: "Components",
    items: [
      { title: "Player", href: "/docs/components/player" },
      { title: "Controls", href: "/docs/components/controls" },
      { title: "Progress", href: "/docs/components/progress" },
      { title: "Volume", href: "/docs/components/volume" },
      { title: "Speed", href: "/docs/components/speed" },
      { title: "Fullscreen", href: "/docs/components/fullscreen" },
      { title: "Loader", href: "/docs/components/loader" },
    ],
  },
  {
    group: "Hooks",
    items: [
      { title: "useYtcnPlayer", href: "/docs/hooks/use-ytcn-player" },
      { title: "useThumbnail", href: "/docs/hooks/use-thumbnail" },
      { title: "useIdleControls", href: "/docs/hooks/use-idle-controls" },
      { title: "useKeyboardShortcuts", href: "/docs/hooks/use-keyboard-shortcuts" },
    ],
  },
  {
    group: "Advanced",
    items: [
      { title: "Headless Usage", href: "/docs/advanced/headless" },
      { title: "Autoplay", href: "/docs/advanced/autoplay" },
      { title: "Thumbnail Strategy", href: "/docs/advanced/thumbnail-strategy" },
      { title: "Branding Removal", href: "/docs/advanced/branding-removal" },
      { title: "Fullscreen", href: "/docs/advanced/fullscreen" },
      { title: "SSR / Next.js", href: "/docs/advanced/ssr" },
    ],
  },
  {
    group: "Reference",
    items: [
      { title: "Limitations", href: "/docs/limitations" },
      { title: "Changelog", href: "/docs/changelog" },
      { title: "Contributing", href: "/docs/contributing" },
    ],
  },
];

/** Returns a flat ordered list of all nav items for prev/next navigation */
export function getAllPages(): NavItem[] {
  return navigation.flatMap((g) => g.items);
}

/** Find prev/next pages relative to the given href */
export function getPageNav(href: string): { prev?: NavItem; next?: NavItem } {
  const pages = getAllPages();
  const idx = pages.findIndex((p) => p.href === href);
  return {
    prev: idx > 0 ? pages[idx - 1] : undefined,
    next: idx < pages.length - 1 ? pages[idx + 1] : undefined,
  };
}
