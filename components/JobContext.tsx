import React, { createContext, useState, ReactNode, useEffect } from 'react';

// Define the Job type
export interface Job {
  id: number;
  name: string;
  info: string;
  email: string;
  extra: string;
  city?: string;
  urgency?: string;
  baseHours?: string;
}

// Define the context type
interface JobsContextType {
  jobs: Job[];
  updateJob: (job: Job) => void;
  jobsReady: boolean;
}

// Create a default context value
const defaultContext: JobsContextType = {
  jobs: [],
  updateJob: () => {}, // No-op function
  jobsReady: false, // Default to false since jobs are not yet loaded
};

// Create the context with a default value
export const JobsContext = createContext<JobsContextType>(defaultContext);

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsReady, setJobsReady] = useState<boolean>(false); // Initialize jobsReady as false

  // Simulate fetching jobs (can be replaced with actual API fetch)
  useEffect(() => {
    const fetchJobs = async () => {
      // Simulate a network request with a delay (for realistic behavior)
      setTimeout(() => {
        const fetchedJobs: Job[] = [
          { id: 1, name: 'Job 1', info: 'info1', email: '@info1', extra: 'extra1' },
          { id: 2, name: 'Job 2', info: 'info2', email: '@info2', extra: 'extra2' },
          { id: 3, name: 'Job 3', info: 'info3', email: '@info3', extra: 'extra3' },
          { id: 4, name: 'Job 4', info: 'info4', email: '@info4', extra: 'extra4' },
        ];
        setJobs(fetchedJobs);
        setJobsReady(true); // Set jobsReady to true after fetching
      }, 2000); // Simulate a 2-second delay for fetching
    };

    fetchJobs(); // Fetch jobs on mount
  }, []);

  const updateJob = (updatedJob: Job) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  return (
    <JobsContext.Provider value={{ jobs, updateJob, jobsReady }}>
      {children}
    </JobsContext.Provider>
  );
};
