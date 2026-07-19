import { useMutation } from '@tanstack/react-query';
import { chatCopilot } from '../services/api';

interface CopilotPayload {
  query: string;
  role: string;
  sessionId: string;
  context?: any;
}

export const useCopilot = () => {
  return useMutation<any, Error, CopilotPayload>({
    mutationFn: ({ query, role, sessionId, context }) => 
      chatCopilot(query, role, sessionId, context),
    onError: (error) => {
      console.error('Error executing AI Copilot pipeline:', error);
    }
  });
};
