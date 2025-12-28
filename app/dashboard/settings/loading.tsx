export default function Loading() {
  return (
    <section className="
    w-full h-full flex flex-col max-w-3xl mx-auto">
      <section className="flex flex-col w-full mx-auto gap-4">
        {/* small box meant to represent the back link btn */}
        <section className="flex flex-col h-12 w-full gap-4 p-2 rounded-lg">
          <section className="h-full w-1/3 animate-pulse rounded-md bg-muted-foreground"></section>
        </section>

        {/* box to represent the card */}
        <section className="flex flex-col h-64 w-3/4 gap-4 p-4 rounded-lg border-2 border-muted-foreground">
          <section className="h-full animate-pulse rounded-md bg-muted-foreground"></section>
          <section className="h-full animate-pulse rounded-md bg-muted-foreground"></section>
          <section className="h-full animate-pulse rounded-md bg-muted-foreground"></section>
          <section className="h-full animate-pulse rounded-md bg-muted-foreground"></section>
        </section>
      </section>
    </section>
  );
}