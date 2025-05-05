export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-5xl flex-1 mx-auto grow flex-col gap-12 ">
      {children}
    </section>
  );
}
