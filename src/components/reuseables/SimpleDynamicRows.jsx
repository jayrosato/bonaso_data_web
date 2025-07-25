import { useState, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import styles from './simpleDynamicRows.module.css'
import errorStyles from "../../styles/errors.module.css";

// Row component
function Row({ row, onCollect, onRemove, index, count }) {
    const [value, setValue] = useState(row.value);
    const [id, setID] = useState(row?.id || null);
    const [deprecated, setDeprecated] = useState(false)
    console.log(deprecated)
  // Register a collector function with the parent
    useEffect(() => {
        onCollect(() => {
        if (value === '') return { error: true };
        console.log(id, value, deprecated)
        return { id, value, deprecated };
        });
    }, [value, deprecated, id, onCollect]);

    return (
        <div className={styles.row}>
            <label htmlFor={row.key}>{index+1}.</label>
            {deprecated ? <p>{value} (Deprecated)</p> :
            <input
                id={row.key}
                type="text"
                name={row.key}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />}
            {id ? <button type="button" onClick={() => setDeprecated(!deprecated)}>{deprecated ? 'Mark as Active' : 'Deprecate'}</button>:
             <button type="button" onClick={() => onRemove(row.key)} disabled={count === 1}>Remove</button>}
        </div>
  );
}

// Main component with forwardRef to expose collection logic
const SimpleDynamicRows = forwardRef(({ label, existing=[] }, ref) => {
    const [rows, setRows] = useState([{ key: Date.now().toString(), value: "" }]);
    const [errors, setErrors] = useState([]);
    const getRow = useRef({});

    useEffect(() => {
        if(existing.length > 0){
            console.log(existing)
            const existingRows = existing.map((ex) => ({key: Date.now().toString() + Math.random().toString(), value: ex.name, id: ex.id }));
            setRows(existingRows);
        }
    }, [existing])

    // Expose collect method to parent
    useImperativeHandle(ref, () => ({
        collect: () => {
        const rowErrors = [];
        const results = [];

        for (const row of rows) {
            const fn = getRow.current[row.key];
            const result = fn ? fn() : null;
            if (!result || result.error) {
                rowErrors.push(`Row "${row.key}" is invalid`);
            } 
            else {
                console.log(result)
                results.push({name: result.value, id: result?.id || null, deprecated: result?.deprecated || null});
            }
        }
        if (rowErrors.length > 0) {
            setErrors(rowErrors);
            return null;
        }
        setErrors([]);
        return results;
        },
    }));

    const addRow = () => {
        setRows(prev => [...prev, { key: Date.now().toString(), value: '' }]);
    };

    const removeRows = (key) => {
        setRows(prev => prev.filter(row => row.key !== key));
        delete getRow.current[key];
    };

    return (
        <div>
        {errors.length > 0 && (
            <div className={errorStyles.errors} role="alert">
            <ul>{errors.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
            </div>
        )}
        <p>{label}</p>
        {rows.map((row, index) => (
            <Row
            key={row.key}
            row={row}
            count={rows.length}
            label={label}
            index={index}
            onRemove={removeRows}
            onCollect={(fn) => { getRow.current[row.key] = fn; }}
            />
        ))}
        <button type="button" onClick={addRow}>Add Row</button>
        </div>
    );
});

export default SimpleDynamicRows;









//simple my ass