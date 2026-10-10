export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-1 items-center justify-center bg-cover bg-center px-4 py-12"
      style={{ backgroundImage: "url(/fondo.webp)" }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}
