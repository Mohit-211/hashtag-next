import { useCallback, useEffect, useState } from "react";
import { GetGraphicsApi, type SavedGraphic } from "@/api/operations/graphics.api";

const PAGE_SIZE = 24;

/** The customer's saved graphics, newest first, a page at a time. */
export function useSavedGraphics() {
  const [graphics, setGraphics] = useState<SavedGraphic[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadPage = useCallback(async (next: number) => {
    try {
      const res = await GetGraphicsApi({ page: next, limit: PAGE_SIZE });
      const body = res?.data?.data;
      const rows: SavedGraphic[] = body?.data ?? [];
      setGraphics((prev) => (next === 1 ? rows : [...prev, ...rows]));
      setTotalPages(body?.pagination?.totalPages ?? 0);
      setPage(next);
      setFailed(false);
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The first page arrives asynchronously, once the request answers.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(1);
  }, [loadPage]);

  const loadMore = () => {
    setLoading(true);
    loadPage(page + 1);
  };

  return { graphics, loading, failed, hasMore: page < totalPages, loadMore };
}
