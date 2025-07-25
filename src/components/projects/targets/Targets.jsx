import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import IndexViewWrapper from '../../reuseables/IndexView';
import styles from './targets.module.css';
import errorStyles from '../../../styles/errors.module.css';
import { useAuth } from '../../../contexts/UserAuth';
import TaskSelect from '../../tasks/TaskSelect';
import prettyDates from '../../../../services/prettyDates';
import Checkbox from '../../reuseables/Checkbox';
import ButtonLoading from '../../reuseables/ButtonLoading';
import SimpleSelect from '../../reuseables/SimpleSelect';
import { tryMatchDates, getMonthDatesStr, getQuarterDatesStr, getWindowsBetween } from '../../../../services/dateHelpers';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ComponentLoading from '../../reuseables/ComponentLoading';
import ButtonHover from '../../reuseables/ButtonHover';
import { PiTargetBold } from "react-icons/pi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosStar, IoIosStarOutline, IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";

export function TargetCard({ existing=null, project, organization, handleChange, onCancel }){
    const { user } = useAuth();
    const [editing, setEditing] = useState(existing ? false : true);
    const [del, setDel] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);

    const [task, setTask] = useState(existing?.task || null)
    const [asP, setAsP] = useState(existing?.related_to ? true : false);
    const [relatedTo, setRelatedTo] = useState(existing?.related_to);
    const [dateType, setDateType] = useState(existing ? tryMatchDates(existing.start, existing.end, project) : {type: '', value: ''});
    const [dates, setDates] = useState(getWindowsBetween(project?.start, project?.end));
    const [expanded, setExpanded] = useState(false);
    const [formData, setFormData] = useState({
        task_id: task || null,
        amount: existing?.amount || '',
        related_to_id: existing?.related_to?.id || null,
        percentage_of_related: existing?.percentage_of_related || '',
        start: existing?.start || '',
        end: existing?.end || '',
    })
    useEffect(() => {
        setDates(getWindowsBetween(project?.start, project?.end));
        setDateType(existing ? tryMatchDates(existing.start, existing.end, project) : {type: '', value: ''})
    }, [project])

    useEffect(() => {
        setTask(existing?.task)
        setFormData({
            task_id: task?.id || null,
            amount: existing?.amount || '',
            related_to_id: existing?.related_to?.id || null,
            percentage_of_related: existing?.percentage_of_related || '',
            start: existing?.start || '',
            end: existing?.end || '',
        })
    }, [existing])

    const saveTarget = async() => {
        let submissionErrors = []
        let data = formData
        if (asP) {
            data.amount = null
            if(data.percentage_of_related == ''|| !data.related_to_id || !data.percentage_of_related){
                submissionErrors.push('Target requires a both related task and a percentage.')
            }
        } 
        else {
            data.percentage_of_related = null;
            data.related_to_id = null;
            if(data.amount == '' || !data.amount){
                submissionErrors.push('Target requires an amount.')
            }
        }
        if(submissionErrors.length > 0){
            setErrors(submissionErrors);
            return;
        }
        setErrors([])
        try{
            setSaving(true);
            console.log('submitting target...', data)
            const url = existing ? `/api/manage/targets/${existing.id}/` : `/api/manage/targets/`;
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                handleChange()
                setEditing(false);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    const hasPerm = useMemo(() => {
        if(user.organization_id == organization?.parent?.id || user.role == 'admin') return true
        return false
    }, [organization, user]);


    const deleteTarget = async() => {
        try {
            console.log('deleting targets...');
            const response = await fetchWithAuth(`/api/manage/targets/${existing.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                handleChange()
                setErrors([]);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete target:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false);
        }
    }

    if(!project || !organization) return <ComponentLoading />
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            {del && <ConfirmDelete name='Target' onConfirm={() => deleteTarget()} onCancel={() => setDel(false)} />}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {task && <h2>Target for {task?.indicator.code}: {task.indicator.name}</h2>}
            {!task && <h2>New Target</h2>}
            {editing &&
                <div onClick={(e) => e.stopPropagation()}>
                    <TaskSelect existing={task} title={'Target for Task'} onChange={(task) => {setFormData(prev => ({...prev, task_id: task?.id})); setTask(task)}} callbackText={'Select Task'} projectID={project.id} organizationID={organization.id}/>
                    
                    <SimpleSelect name={'date_type'} label={'Select a Date Form'} optionValues={['months', 'quarters', 'custom']} 
                        optionLabels={['By Month', 'By Quarter', 'Custom']} callback={(val) => setDateType(prev => ({...prev, type: val}))} 
                        value={dateType.type} 
                    />
                    
                    {dateType.type ==='quarters' && 
                        <SimpleSelect name={'date_type_value'} label={`Select a ${dateType.type}`} 
                            optionLabels={dates[dateType.type]} optionValues={dates[dateType.type]}
                            callback={(val) => {setFormData(prev => ({...prev, 
                                start: getQuarterDatesStr(val, project).start, end: getQuarterDatesStr(val, project).end
                            })); setDateType(prev => ({...prev, value: val}))}} value={dateType.value}
                        />
                    }
                    {dateType.type ==='months' && 
                        <SimpleSelect name={'date_type_value'} label={`Select a ${dateType.type}`} 
                            optionLabels={dates[dateType.type]} optionValues={dates[dateType.type]}
                            callback={(val) => {setFormData(prev => ({...prev, 
                                start: getMonthDatesStr(val, project).start, end: getMonthDatesStr(val, project).end
                            })); setDateType(prev => ({...prev, value: val}))}} value={dateType.value}
                        />
                    }
                    {dateType.type === 'custom' && <div>
                        <label htmlFor='start'>Start</label>
                        <input id='start' name='start' type='date' value={formData.start} onChange={(e) => setFormData(prev => ({...prev, start: e.target.value}))}/>
                        <label htmlFor='end'>End</label>
                        <input id='end' name='end' type='date' value={formData.end} onChange={(e) => setFormData(prev => ({...prev, end: e.target.value}))}/>
                    </div>}
                    
                    
                    <Checkbox checked={asP} callback={(checked) => setAsP(checked)} name='as_percentage' label='Measure as a Percentage of Achievement for Another Task?' />
                    {!asP && 
                        <div>
                            <label htmlFor='amount'>Amount</label>
                            <input id='amount' name='amount' type='number' value={formData.amount} onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))} required={true}/>
                            </div>
                    }
                    {asP && 
                        <div>
                            <TaskSelect existing={relatedTo} title={'As a Percentage of Task'} onChange={(task) => {setFormData(prev => ({...prev, related_to_id: task?.id})); setRelatedTo(task)}} callbackText={'Select Task'} projectID={project?.id} organizationID={organization?.id}/>
                            {relatedTo && <div>
                                <label htmlFor='percentage'>Percentage of {relatedTo.indicator.name}</label>
                                <input id='percentage' name='percentage' type='number' min='0' max='100' value={formData.percentage_of_related || ''} onChange={(e) => setFormData(prev => ({...prev, percentage_of_related: e.target.value}))} required={true}/>
                            </div>}
                        </div>
                    }
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {!saving && <ButtonHover callback={() => saveTarget()} noHover={<IoIosSave />} hover={'Save'} /> }
                        {saving && <ButtonLoading />}
                        <ButtonHover callback={() => {existing ? setEditing(false) : onCancel()}} noHover={<FcCancel />} hover={'Cancel'} />
                    </div>
                </div>
            }
            {!editing && <div onClick={() => setExpanded(!expanded)}>
                {expanded && <div>
                    <p>{dateType?.value} ({(prettyDates(formData?.start))} to {prettyDates(formData?.end)})</p>
                    {formData.amount && <p>Achievement: {existing.achievement || 0} of {formData.amount} ({formData.amount != 0 ? Math.round((existing.achievement/formData.amount)*100) : '0'}%)</p>}
                    {relatedTo && <p>{formData.percentage_of_related}% of {relatedTo?.indicator.name} ({existing.achievement} of {existing.related_as_number}, {existing.related_as_number !== 0 ? Math.round((existing.achievement/existing.related_as_number)*100) : '0'}%)</p>}
                    <div style={{ display: 'flex', flexDirection: 'row'}}>
                        {hasPerm && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit'} />}
                        {hasPerm && !editing && !del && <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Target'} forDelete={true} />}
                    </div>
                </div>}
        </div>}
    </div>
    )
}



export default function Targets({ project, organization}) {
    const { id, orgID } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [adding, setAdding] =useState(false);
    const [targets, setTargets] = useState([]);

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState(0);

    useEffect(() => {
        const getTargets = async () => {
            if(!id || !orgID) return;
            setLoading(true);
            try {
                console.log('fetching targets...');
                const response = await fetchWithAuth(`/api/manage/targets/?task__organization=${orgID}&task__project=${id}`);
                const data = await response.json();
                if(response.ok){
                    setEntries(data.count);
                    setTargets(data.results);
                    setLoading(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                setErrors(['Failed to fetch targets. Please try again later.'])
                console.error('Failed to fetch organization: ', err);
                setLoading(false)
            }
        }
        getTargets();
    }, [id, orgID])

    const handleChange = async () => {
        const getTargets = async () => {
            if(!id || !orgID) return;
            try {
                console.log('fetching targets...');
                const response = await fetchWithAuth(`/api/manage/targets/?task__organization=${orgID}&task__project=${id}`);
                const data = await response.json();
                if(response.ok){
                    setEntries(data.count);
                    setTargets(data.results);
                    setAdding(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                setErrors(['Failed to fetch targets. Please try again later.'])
                console.error('Failed to fetch organization: ', err);
            }
        }
        getTargets();
    }
    const hasPerm = useMemo(() => {
        if(!user || !organization) return false;
        if(user.organization_id == organization?.parent?.id || user.role == 'admin') return true
        return false
    }, [organization, user]);

    console.log(targets)
    if (loading) return <ComponentLoading />
    return (
        <div>
            {hasPerm && 
                <ButtonHover callback={() => setAdding(true)} noHover={<PiTargetBold />} hover={'New Target'} />}
            <IndexViewWrapper entries={entries} onSearchChange={setSearch} page={page} onPageChange={setPage}>
                {adding && <TargetCard organization={organization} project={project} handleChange={handleChange} onCancel={() => setAdding(false)} /> }
                {(targets && project && organization && targets?.length) == 0 ? 
                    <p>No targets yet. Make one!</p> :
                    targets?.map(tar => (
                    <TargetCard key={tar.id} existing={tar} organization={organization} project={project} handleChange={handleChange} />
                    ))
                }
            </IndexViewWrapper>
        </div>
    )
}