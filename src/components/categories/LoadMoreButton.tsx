import { Button } from "@/components/ui/button";

const LoadMoreButton = ({ hasMore, onLoadMore }) => {
  if (!hasMore) return null;

  return (
    <div className="text-center mt-12">
      <Button variant="outline" size="lg" onClick={onLoadMore}>
        Load More
      </Button>
    </div>
  );
};

export default LoadMoreButton;
