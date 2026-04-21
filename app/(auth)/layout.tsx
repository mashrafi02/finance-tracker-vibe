export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(0,0,0,0.03),transparent_30%)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  )
}
