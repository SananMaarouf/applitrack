import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "../api/test";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['hello'],
    queryFn:fetchData,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{(error as Error).message}</div>;

  return (
    <div>
      <h1>Message from Backend</h1>
      <p>{data}</p>
    </div>
  );
}

export default HomeComponent;