import { createContext, useContext, useState } from 'react';

const ProjectsContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [projectDetails, setProjectDetails] = useState([]);
    const [projectsMeta, setProjectsMeta] = useState({});
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState({});
    return (
        <ProjectsContext.Provider value={{ projects, setProjects, 
            projectDetails, setProjectDetails, 
            projectsMeta, setProjectsMeta,
            clients, setClients,
            tasks, setTasks 
        }}>
            {children}
        </ProjectsContext.Provider>
    );
};

export const useProjects = () => useContext(ProjectsContext);