import React from 'react';
import { useEffect, useState } from 'react';
import { FaSearch } from "react-icons/fa";

export default function IndexViewWrapper({ children, page, onSearchChange, onPageChange, entries, filter=null }){
    const [search, setSearch] = useState('');
    //const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    useEffect(() => {
        const pages = Math.ceil(entries / 20) == 0 ? 1 : Math.ceil(entries / 20);
        setTotalPages(pages)
    }, [entries])

    const handleSearch = (val) => {
        onSearchChange?.(val); // optional chaining in case the prop isn't passed
        //setPage(1); // reset to first page on new search
        onPageChange?.(1); // tell parent we moved to page 1
    };

    const handlePageChange = (newPage) => {
        onPageChange?.(newPage);
        //setPage(newPage);
    };

    return( 
        <div >
            <div>
                <input type='text' onChange={(e) => handleSearch(e.target.value)}/>
                
                {filter && filter}
            </div>
            { children }
            <div>
                <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>Previous Page</button>
                    <span>Showing Page {page} of {totalPages}</span>
                <button type="button" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>Next Page</button>
            </div>
        </div>
    )
}

//<button type="button" onClick={handleSearch}><FaSearch /> Search</button>