import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useIndicators } from '../../contexts/IndicatorsContext';
import IndicatorForm from './IndicatorForm';
import indicatorConfig from './indicatorConfig';


export default function CreateIndicator(){
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { indicators, setIndicators, setIndicatorDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const [indicatorIDs, setIndicatorIDs] = useState([]);
    const [indicatorNames, setIndicatorNames] = useState([]);
    const fetchedRef = useRef(false);

    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    console.log(data)
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                    setLoading(false)
                }
            }
        }
        getMeta()

        const getIndicators = async () => {
            if (fetchedRef.current || indicators.length !== 0) {
                const ids = indicators.map(o => o.id);
                const names = indicators.map(o => o.name);
                setIndicatorIDs(ids);
                setIndicatorNames(names);
                setLoading(false);
                return;
            }

            try {
                console.log('fetching model info...');
                const response = await fetchWithAuth(`/api/indicators/`);
                const data = await response.json();
                setIndicators(data.results);
                setLoading(false);
                fetchedRef.current = true;
            } catch (err) {
                console.error('Failed to fetch indicators: ', err);
                setLoading(false);
            }
        };

        getIndicators();
    }, []);

    const formConfig = useMemo(() => {
        return indicatorConfig(indicatorIDs, indicatorNames, indicatorsMeta.statuses);
    }, [indicatorIDs, indicatorNames, indicatorsMeta]);

    const handleCancel = () => {
        navigate('/indicators')
    }

    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
        try{
            const response = await fetchWithAuth('/api/indicators/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setIndicatorDetails(prev => [...prev, returnData])
                navigate(`/indicators/${returnData.id}`);
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
            console.error('Could not record indicator: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>New Indicator</h1>
            <IndicatorForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors} />
        </div>
    )
}