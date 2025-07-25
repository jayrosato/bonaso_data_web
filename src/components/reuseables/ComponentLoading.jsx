import React from 'react';
import styles from './loading.module.css';

export default function ComponentLoading (){
    return( 
        <div className={styles.componentLoading}>
            <div className={styles.loadingBars}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
};