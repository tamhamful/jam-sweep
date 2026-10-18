// Simple line icons for the home tiles and header.
const PATHS = {
  results: 'M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5',
  matchPlay: 'M4 5h5v4H4z M4 15h5v4H4z M9 7h3v10H9 M12 12h4 M16 10h4v4h-4z',
  ryderCup: 'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 20h8 M10 17h4',
  leaderboards: 'M4 20h16 M6 20v-6h3v6 M10.5 20V8h3v12 M15 20v-9h3v9',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  share: 'M12 4v11 M7 9l5-5 5 5 M5 14v5h14v-5',
}

export function Icon({ name, className, size = 24 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
