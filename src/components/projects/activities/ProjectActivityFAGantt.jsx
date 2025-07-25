import { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import ganttBuilder from './ganttBuilder';
import theme from '../../../../theme/theme';
import cleanLabels from '../../../../services/cleanLabels';
import prettyDates from '../../../../services/prettyDates';

export default function ProjectActivityFAGantt({ project, activities, deadlines }){
    const data = useMemo(() => {
        return ganttBuilder(project, activities, deadlines)
    }, [project, activities]);
    console.log(data)
    const today = new Date();
    const projectStart = new Date(project.start);
    const todayOffset = (today - projectStart) / (1000 * 60 * 60 * 24);

    const deadlineLines = useMemo(() => {
        if(deadlines.length === 0) return [];
        return deadlines.map(a => ({
                name: a.name,
                date: a.deadline_date,
                offset: (new Date(a.deadline_date) - new Date(project.start)) / (1000 * 60 * 60 * 24),
        }))
    }, [project, deadlines]);

    const ref = useRef();
    const [chartWidth, setChartWidth] = useState(0);

    useEffect(() => {
    if (ref.current) {
        setChartWidth(ref.current.offsetWidth);
    }
    }, []);


    const ReferenceLineLabel = ({ viewBox, value, deadline }) => {
        const { x, y } = viewBox;
        const [hovered, setHovered] = useState(false);
        const [cursorX, setCursorX] = useState(null);
        const [cursorY, setCursorY] = useState(null);

        const isLeft = useMemo(() => {
            return cursorX < chartWidth/2
        }, [chartWidth, cursorX])

        const estimatedWidth = value.length * 7;
        return (
            <g transform={`translate(${x - estimatedWidth / 2}, ${y - 20})`}
                onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                onMouseMove={(e) => {setCursorY(e.nativeEvent.offsetY); setCursorX(e.nativeEvent.offsetX)}}
            >
                <line x1={estimatedWidth / 2} x2={estimatedWidth / 2} y1={20} y2={280} strokeWidth={deadline ? 6 : 3} stroke={deadline ? theme.colors.errorBg : "white"} strokeDasharray={deadline ? '' : '7,3'}/>
                {hovered && <rect x={isLeft ? estimatedWidth/2 + 20 : -estimatedWidth/2 - 30}  y={cursorY -20} width={estimatedWidth + 20} height={40} fill={theme.colors.bonasoDarkAccent} stroke="white" strokewith={10} />}
                {hovered && <text x={isLeft ? estimatedWidth + 30 : -20} 
                    y={cursorY+5} textAnchor="middle" fontSize={15} fill="white">
                    {value}
                </text>}
            </g>
        );
    };
    
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        // Only show tooltip if the 'duration' bar is in the stack
        const filteredPayload = payload.filter(p => p.dataKey === 'duration');
        if (filteredPayload.length === 0) return null;

        // Use the original data object from the duration bar
        const entry = filteredPayload[0].payload;

        return (
            <div
                className="custom-tooltip"
                style={{
                    background: theme.colors.bonasoDarkAccent,
                    padding: '8px',
                    border: '1px solid #ccc',
                }}
            >
                <p><strong>{entry.name}</strong></p>
                <p>Category: {cleanLabels(entry.category)}</p>
                <p>Duration: {entry.duration} days</p>
            </div>
        );
    };
    return(
        <div style={{ backgroundColor: theme.colors.bonasoDarkAccent}} ref={ref}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart width={700} height={300} data={data} layout="vertical">
                    <XAxis
                        type="number"
                        tick={{ fill: 'white'}}
                        tickFormatter={(val) => {
                            const dt = new Date(new Date(project.start).getTime() + val * 24 * 60 * 60 * 1000);
                            return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                    />
                    <YAxis type="category" dataKey="name" tick={null} />
                    {/* Offset bar - invisible, pushes duration to start */}
                    <Tooltip cursor={{ fill: 'none' }} content={<CustomTooltip />} />
                    <Bar dataKey="start" stackId="gantt" fill="transparent" style={{ pointerEvents: 'none' }} />
                    <Bar dataKey="duration" stackId="gantt">
                    {data.map((entry, index) => (
                        <Cell key={`duration-${index}`} fill={entry.durationFill} />
                    ))}
                    </Bar>
                    {deadlineLines.map((d, index) => (
                        <ReferenceLine
                            key={index}
                            x={d.offset}
                            label={<ReferenceLineLabel value={`${d.name} - ${prettyDates(d.date)}`} deadline={true}/>}
                        />
                    ))}
                    <ReferenceLine 
                        x={todayOffset} 
                        label={<ReferenceLineLabel value={'Today'} deadline={false} />} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}