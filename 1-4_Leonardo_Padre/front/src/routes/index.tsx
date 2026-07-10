import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Chat } from "@/components/Chat";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <Chat />
      </div>
    </div>
  );
}
