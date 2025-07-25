import React from 'react';
import styles from '../../styles/indexView.module.css'
import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import RespondentFilters from './RespondentFilters';
import IndexViewWrapper from '../reuseables/IndexView';
import { useRespondents } from '../../contexts/RespondentsContext';
import { Link } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import { IoPersonAddSharp } from "react-icons/io5";
import ComponentLoading from '../reuseables/ComponentLoading';

function RespondentCard({ respondent }) {
    const [loading, setLoading] = useState(false);
    const { respondentDetails, setRespondentDetails, respondentsMeta } = useRespondents();
    const [active, setActive] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [labels, setLabels] = useState({})

    useEffect(() => {
        if (!respondentsMeta?.sexs || !active) return;
        const sexIndex = respondentsMeta.sexs.indexOf(active.sex);
        const districtIndex = respondentsMeta.districts.indexOf(active.district)
        const ageRangeIndex = respondentsMeta.age_ranges.indexOf(active.age_range)
        setLabels({
            district: respondentsMeta.district_labels[districtIndex],
            sex: respondentsMeta.sex_labels[sexIndex],
            age_range: respondentsMeta.age_range_labels[ageRangeIndex]
        })
    }, [respondentsMeta, active])
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;

        const found =  respondentDetails.find(r => r.id === respondent.id);
        if (found) {
            setActive(found);
            return;
        }

        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/record/respondents/${respondent.id}/`);
            const data = await response.json();
            setRespondentDetails(prev => [...prev, data]);
            setActive(data);
            setLoading(false);
        } 
        catch (err) {
            console.error('Failed to fetch organizatons: ', err);
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            <Link to={`/respondents/${respondent.id}`} style={{display:'flex', width:"fit-content"}}><h2>{respondent.is_anonymous ? ('Anonymous ' + respondent.uuid) : (respondent.first_name + ' ' + respondent.last_name)}</h2></Link>
            {expanded && loading && <ComponentLoading />}
            {active == respondent.id && loading &&
                <ComponentLoading />
            }
            {expanded && active && (
                <>
                    <h4>{respondent.village}, {labels.district}</h4>
                    <p>{labels.age_range}, {labels.sex}</p>
                    <p>{active.citizenship}</p>
                    <p>{active.comments ? active.comments : 'No Comments'}</p>
                    <Link to={`/respondents/${respondent.id}`}> <button>Go to Respondent</button></Link>
                    <Link to={`/respondents/${respondent.id}/edit`}> <button>Edit Details</button></Link>
                </>
            )}
        </div>
    );
}

export default function RespondentsIndex(){
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { respondents, setRespondents } = useRespondents();
    const [loading, setLoading] = useState(true);
    const [sexFilter, setSexFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('')
    const [ageRangeFilter, setAgeRangeFilter] = useState('')

    useEffect(() => {
        const loadRespondents = async () => {
            try {
                const filterQuery = 
                    (sexFilter? `&sex=${sexFilter}` : '') + 
                    (districtFilter ? `&district=${districtFilter}` : '') + 
                    (ageRangeFilter ? `&age_range=${ageRangeFilter}` : '');
                
                const url = `/api/record/respondents/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setRespondents(data.results);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch respondents: ', err);
                setLoading(false);
            }
        };

        loadRespondents();
    }, [page, search, setRespondents, ageRangeFilter, sexFilter, districtFilter]);

    const setFilters = (filters) => {
        setSexFilter(filters.sex);
        setDistrictFilter(filters.district);
        setAgeRangeFilter(filters.age_range)
    }

    if(loading) return <Loading />
    return(
        <div className={styles.index}>
            <h1>Respondents</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={<RespondentFilters onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}}/>}>
                <Link to='/respondents/new'><button> <IoPersonAddSharp style={{marginRight: '1vh'}}/> Create New Respondent</button></Link>
                {Array.isArray(respondents) && respondents.length === 0 ? (
                        <p>No respondents match your criteria.</p>
                    ) : (
                        Array.isArray(respondents) ? respondents.map(p => (
                            <RespondentCard key={p.id} respondent={p} />
                        )) : null
                )}
            </IndexViewWrapper>
        </div>
    )
}