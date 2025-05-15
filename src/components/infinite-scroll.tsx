import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";
import { Button } from "./ui/button";

interface InfiniteScrollProps {
  isManual?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollProps) => {
  const { targetRef, isInterecting } = useIntersectionObserver({
    rootMargin: "100px",
    threshold: 0.5,
  });

  useEffect(() => {
    if (isInterecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage();
    }
  }, [isInterecting, hasNextPage, isFetchingNextPage, fetchNextPage, isManual]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div ref={targetRef} className="h-1"/>
      {hasNextPage ? (
        <Button variant={"secondary"} disabled={isFetchingNextPage || !hasNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? "Loading..." : "Load more"} 
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">You have reached the end of the list</p>
      )}
    </div>
  )
}