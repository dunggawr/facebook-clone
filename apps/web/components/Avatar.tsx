export function Avatar({ name, src, size = 40 }: { name: string; src: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size / 2.2 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
