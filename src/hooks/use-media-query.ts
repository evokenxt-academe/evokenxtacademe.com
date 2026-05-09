import * as React from "react"

/**
 * Hook to check if a media query matches the current viewport
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        const mediaQueryList = window.matchMedia(query)
        const handleChange = (e: MediaQueryListEvent) => {
            setMatches(e.matches)
        }

        mediaQueryList.addEventListener("change", handleChange)
        setMatches(mediaQueryList.matches)

        return () => {
            mediaQueryList.removeEventListener("change", handleChange)
        }
    }, [query])

    return matches
}
