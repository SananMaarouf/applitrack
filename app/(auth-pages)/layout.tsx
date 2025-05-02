export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-6xl flex grow flex-col gap-12 mx-auto">{children}</section>
  );
}
