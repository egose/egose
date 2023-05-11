import React, { useEffect } from 'react';
import egoseAdapter from '@egose/adapter-js/src/index';
import { usePagination } from '@egose/react-pagination-hook/src/index';

interface User {
  name?: string;
  role?: string;
  statusHistory?: any[];
  public?: boolean;
  [key: string]: any;
}

const adapter = egoseAdapter.createAdapter({ baseURL: '/api' });
const userService = adapter.createModelService<User>({ modelName: 'User', basePath: 'users' });
const pageSizes = [5, 10, 20, 30, 60, 100];

const App = () => {
  const {
    isLoading,
    isError,
    message,
    data,
    page,
    pageSize,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    sort,
    filter,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setFilter,
    setSort,
    canNextPage,
    canPreviousPage,
  } = usePagination<User>({ service: userService, initialPageSize: 5, initialSort: '_id' });

  useEffect(() => {
    async function loadSampleData() {
      gotoPage(1);
    }

    loadSampleData();
  }, []);

  return (
    <>
      <div className="container">
        <div>
          <span>Page Size:&nbsp;</span>
          <div className="dropdown">
            <button type="button" className="btn black">
              {pageSize}
            </button>
            <div className="dropdown-content">
              {pageSizes.map((num) => {
                return (
                  <button type="button" className="btn gray" onClick={() => setPageSize(num)}>
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <input
            type="text"
            maxLength={50}
            onChange={(e) => {
              const fuzzy = { $regex: e.target.value, $options: 'i' };
              setFilter({ name: fuzzy });
            }}
          />
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th onClick={() => setSort(sort === '_id' ? '-_id' : '_id')}>ID {sort === '_id' ? '↑' : '↓'}</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            return (
              <tr>
                <td>{item._id}</td>
                <td>{item.name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="container">
        <div className="mt-1">
          {totalCount > 0 ? `Showing ${startIndex + 1}-${endIndex + 1} of ${totalCount} rows` : `No items found`}
        </div>
        <div>
          <button type="button" className="btn green" onClick={previousPage} disabled={!canPreviousPage}>
            Prev
          </button>
          <div className="dropdown">
            <button type="button" className="btn black">
              {page}
            </button>
            <div className="dropdown-content">
              {Array.from({ length: totalPages }).map((_, ind) => {
                const _page = ind + 1;
                return (
                  <button type="button" className="btn gray" onClick={() => gotoPage(_page)}>
                    {_page}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" className="btn blue" onClick={nextPage} disabled={!canNextPage}>
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default App;
