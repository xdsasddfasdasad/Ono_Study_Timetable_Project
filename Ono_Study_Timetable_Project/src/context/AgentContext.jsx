import React, { createContext, useState, useContext } from 'react';

const AgentContext = createContext(null);

export const AgentProvider = ({ children }) => {
    const [isAgentOpen, setIsAgentOpen] = useState(false);

    const value = {
        isAgentOpen,
        setIsAgentOpen,
    };

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) { throw new Error('useAgent must be used within an AgentProvider'); }
  return context;
};