import { useCallback, useState } from 'react';
import { Model, ModelService, PopulateAccess } from '@egose/adapter-js';

export interface UsePaginationResult<T> {
  isLoading: boolean;
  isError: boolean;
  message: string;
  raw: T[];
  data: (Model<T> & T)[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sort: any;
  filter: any;
  gotoPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  setPageSize: (pageSize: number) => Promise<void>;
  setFilter: (filter: any) => Promise<void>;
  setSort: (sort: any) => Promise<void>;
  canNextPage: boolean;
  canPreviousPage: boolean;
}

export function usePagination<T>({
  service,
  initialPage,
  initialPageSize,
  initialSort,
  initialFilter,
  select,
  populate,
  options,
}: {
  service: ModelService<T>;
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: any;
  initialFilter?: any;
  select?: any;
  populate?: any;
  options?: {
    includePermissions?: boolean;
    includeCount?: boolean;
    populateAccess?: PopulateAccess;
    lean?: boolean;
  };
}): UsePaginationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState('');
  const [raw, setRaw] = useState<T[]>([]);
  const [data, setData] = useState<(Model<T> & T)[]>([]);
  const [sort, setSort] = useState(initialSort ?? '');
  const [filter, setFilter] = useState(initialFilter ?? {});
  const [page, setPage] = useState(initialPage ?? 0);
  const [pageSize, setPageSize] = useState(initialPageSize ?? 10);
  const [totalCount, setTotalCount] = useState(0);
  const _options = { ...options, includeCount: true };

  const handleResult = useCallback((result) => {
    if (result.success) {
      setIsError(false);
      setRaw(result.raw);
      setData(result.data);
      setTotalCount(result.totalCount);
    } else {
      setIsError(true);
      setData([]);
      setData([]);
      setTotalCount(0);
      setMessage(result.message);
    }
  }, []);

  const _setSort = useCallback(async (_sort) => {
    setIsLoading(true);

    const result = await service.listAdvanced(filter, { select, populate, page, pageSize, sort: _sort }, _options);
    handleResult(result);

    setSort(_sort);
    setIsLoading(false);
  }, []);

  const _setFilter = useCallback(async (_filter) => {
    setIsLoading(true);

    const result = await service.listAdvanced(_filter, { select, populate, page: 1, pageSize, sort }, _options);
    handleResult(result);

    setFilter(_filter);
    setPage(1);
    setIsLoading(false);
  }, []);

  const _gotoPage = useCallback(async (_page: number) => {
    setIsLoading(true);

    const result = await service.listAdvanced(filter, { select, populate, page: _page, pageSize, sort }, _options);
    handleResult(result);

    setPage(_page);
    setIsLoading(false);
  }, []);

  const _nextPage = useCallback(async () => {
    setIsLoading(true);

    const npage = page + 1;
    const result = await service.listAdvanced(filter, { select, populate, page: npage, pageSize, sort }, _options);
    handleResult(result);

    setPage(npage);
    setIsLoading(false);
  }, []);

  const _previousPage = useCallback(async () => {
    setIsLoading(true);

    const ppage = page - 1;
    const result = await service.listAdvanced(filter, { select, populate, page: ppage, pageSize, sort }, _options);
    handleResult(result);

    setPage(ppage);
    setIsLoading(false);
  }, []);

  const _setPageSize = useCallback(async (_pageSize: number) => {
    setIsLoading(true);

    const result = await service.listAdvanced(
      filter,
      { select, populate, page: 1, pageSize: _pageSize, sort },
      _options,
    );
    handleResult(result);

    setPageSize(_pageSize);
    setPage(1);
    setIsLoading(false);
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);

  return {
    isLoading,
    isError,
    message,
    raw,
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    sort,
    filter,
    gotoPage: _gotoPage,
    nextPage: _nextPage,
    previousPage: _previousPage,
    setPageSize: _setPageSize,
    setFilter: _setFilter,
    setSort: _setSort,
    canNextPage: page < totalPages,
    canPreviousPage: page > 1,
  };
}
