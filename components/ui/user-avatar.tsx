type AvatarSize = "sm" | "md" | "lg";

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

// Xocolatísimo (User.name es opcional en el schema, ver xoco-api) no tiene
// foto de perfil — a diferencia de ecoguide-app, este avatar siempre son
// iniciales: del nombre si existe, si no la primera letra del correo.
export function UserAvatar({ name, email, size = "md", className = "" }: UserAvatarProps) {
  const initial = (name?.trim()?.charAt(0) ?? email?.charAt(0) ?? "?").toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ${SIZE_CLASS[size]} ${className}`}
    >
      {initial}
    </span>
  );
}
