import { cn } from "cn"

/** Ícono genérico de "hoja de cálculo" en verde — no es el logo de
 * Microsoft Excel, es una referencia visual reconocible (documento +
 * "X") para el botón de exportar. */
function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="18" height="18" rx="4" fill="#1F7A45" />
      <rect x="1" y="1" width="18" height="18" rx="4" fill="url(#excel-icon-gradient)" fillOpacity="0.15" />
      <path
        d="M6.1 6.3h2.02l1.53 2.51 1.53-2.51h2.02l-2.5 3.7 2.58 3.7h-2.05l-1.58-2.57-1.58 2.57H6.08l2.58-3.7-2.56-3.7Z"
        fill="white"
      />
      <defs>
        <linearGradient id="excel-icon-gradient" x1="1" y1="1" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export { ExcelIcon }
