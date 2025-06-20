import React from 'react';
import { useEffect, useState } from "react";
import { useProjects } from '../../../contexts/ProjectsContext';
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { useAuth } from '../../../contexts/UserAuth';
import IndicatorsIndex from '../../indicators/IndicatorsIndex';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import styles from './projectDetail.module.css';
import errorStyles from '../../../styles/errors.module.css';



function IndicatorCard({ indicator, callback }){
    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(indicator));
    };

    return(
        <div className={styles.card} draggable onDragStart={handleDragStart} onClick={() => callback('view-indicator', indicator)}>
            <h3>{indicator.code}: {indicator.name}</h3>
        </div>
    )
}

export function IndicatorsBar({ project, callback }){
    return(
        <div  className={styles.sidebar}>
            <h2>Project Indicators</h2>
            <button onClick={() => callback('add-indicator')}>Add an Indicator</button>
            {project?.indicators.length > 0 ? project.indicators.map((ind) => (
                <IndicatorCard key={ind.id} indicator={ind} callback={callback}/>
            )) :
            <p>This project doesn't have any indicators yet.</p>
            }
        </div>
    )
}


export function AddIndicator({ project }){
    const { setProjectDetails } = useProjects();
    const [projectIndicators, setProjectIndicators] = useState([]);
    console.log(project)
    useEffect(() => {
        if(project?.indicators.length > 0){
            const ids = project.indicators.map((ind) => ind.id)
            setProjectIndicators(ids)
        }
    }, [project])
    console.log(projectIndicators)
    const addIndicator = async (ind) => {
        console.log('adding indicator...', ind)
        try{
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'indicator_id': [ind.id]
                })
            });
            if(response.ok){
                setProjectDetails(prevState =>
                    prevState.map(p =>
                    p.id === project.id
                        ? {
                            ...p,
                            indicators: [...(p.indicators || []), ind],
                        }
                        : p
                    )
                );
                setProjectIndicators(prev => [...prev, ind.id]);
            }
            else{
                const data = await response.json();
                console.log(data);
            }
        }
        catch(err){
            console.error('Could not record indicator: ', err)
        }
    }
    return <IndicatorsIndex blacklist={projectIndicators} callback={(ind) => addIndicator(ind)} />
}


export function ViewIndicator({ project, indicator, onRemove }){
    const {user} = useAuth();
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);
    const { setProjectDetails } = useProjects();
    const removeIndicator = async() => {
        try {
            console.log('deleting indicator...');
            const response = await fetchWithAuth(`/api/manage/projects/${project.id}/remove-indicator/${indicator.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setProjectDetails(prevState =>
                    prevState.map(p =>
                    p.id === project.id
                        ? {
                            ...p,
                            indicators: p.indicators.filter(ind => ind.id != indicator.id),
                        }
                        : p
                    )
                );
                onRemove()
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
                    } 
                    else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to remove indicator:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        setDel(false)
    }
    
    return (
        <div className={styles.viewbox}>
            {del && 
                <ConfirmDelete 
                    name={indicator.name + ' from project ' + project.name} 
                    statusWarning={'If there are any active tasks, you will be prevented from doing this.'} 
                    onConfirm={() => removeIndicator()} onCancel={() => setDel(false)} 
            />}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <h2>{indicator.code}: {indicator.name}</h2>
            <h5>In project {project.name}</h5>
            <p>{indicator.description}</p>
            <p>Eventually, we'll add data related to the indicator based on interactions linked to the project.org</p>
            {user.role =='admin' && <p>Admins will see a component here related to general indicators</p>}
            {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Remove Indicator From Project</button>}
            {['meofficer, manager'].includes(user.role) && <p>Organizations will see a component here related to their tasks</p>}
        </div>
    )
}