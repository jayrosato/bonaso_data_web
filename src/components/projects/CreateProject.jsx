import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css'
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useProjects } from '../../contexts/ProjectsContext';
import styles from '../reuseables/dynamicForm.module.css';
import projectsConfig from './projectsConfig';

export default function CreateProject(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { projectsMeta, setProjectsMeta, setProjectDetails } = useProjects();
    const [clientIDs, setClientIDs] = useState([]);
    const [clientNames, setClientNames] = useState([]);
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const getProjectMeta = async () => {
            if(Object.keys(projectsMeta).length != 0){
                if(projectsMeta.clients){
                    const clientIDs = projectsMeta.clients.map((c) => c.id);
                    const clientNames= projectsMeta.clients.map((c)=> c.name);
                    setClientIDs(clientIDs);
                    setClientNames(clientNames);
                    setLoading(false)
                }
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/manage/projects/meta/`);
                    const data = await response.json();
                    setProjectsMeta(data);
                    if(data.clients){
                        const clientIDs = data.clients.map((c) => c.id);
                        const clientNames= data.clients.map((c)=> c.name);
                        setClientIDs(clientIDs);
                        setClientNames(clientNames);
                    }
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch projects: ', err)
                    setLoading(false)
                }

            }
        }
        getProjectMeta();

    }, [projectsMeta])

    const formConfig = useMemo(() => {
        return projectsConfig(projectsMeta);
    }, [projectsMeta]);

    const handleCancel = () => {
        navigate(`/projects`)
    }
    const handleSubmit = async(data) => {
        if(data.start > data.end){
            setErrors(['Start date must be after the end date.'])
            return;
        }
        console.log('submitting data...', data)
        try{
            setSaving(true);
            const response = await fetchWithAuth('/api/manage/projects/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setProjectDetails(prev => [...prev, returnData])
                navigate(`/projects/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            <h1>Creating a New Project</h1>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving}/>
        </div>
    )
}