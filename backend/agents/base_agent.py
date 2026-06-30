import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Union
from backend.contracts.agent_schemas import AgentInput, AgentOutput

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

class BaseAgent(ABC):
    """
    Abstract base class for all KSP Crime Copilot agents.
    Provides validation, execution timing, logging, and error handling.
    """
    def __init__(self, name: str = None):
        self.name = name or self.__class__.__name__
        self.logger = logging.getLogger(self.name)

    def run(self, message: Union[AgentInput, Dict[str, Any]]) -> AgentOutput:
        """
        Executes the agent workflow with input/output validation.
        """
        start_time = time.time()
        self.logger.info("Starting agent execution.")
        
        # 1. Parse and validate input
        try:
            if isinstance(message, dict):
                validated_input = AgentInput.model_validate(message)
            elif isinstance(message, AgentInput):
                validated_input = message
            else:
                raise ValueError("Message must be an instance of AgentInput or a dictionary matching the schema.")
        except Exception as e:
            self.logger.error(f"Input validation failed: {str(e)}")
            raise ValueError(f"Invalid agent input: {str(e)}") from e

        # 2. Execute agent logic
        try:
            output = self._execute(validated_input)
        except Exception as e:
            self.logger.exception(f"Exception occurred during execution: {str(e)}")
            # Return an error response that is still schema-valid
            output = AgentOutput(
                data={
                    "status": "error",
                    "error_message": str(e),
                    "agent_name": self.name
                },
                chunks=[]
            )

        # 3. Validate and return output
        try:
            validated_output = AgentOutput.model_validate(output)
            duration = time.time() - start_time
            self.logger.info(f"Agent execution completed in {duration:.3f}s. Validation successful.")
            return validated_output
        except Exception as e:
            self.logger.error(f"Output validation failed: {str(e)}")
            raise ValueError(f"Agent produced invalid output schema: {str(e)}") from e

    @abstractmethod
    def _execute(self, message: AgentInput) -> AgentOutput:
        """
        Core execution logic to be implemented by child classes.
        """
        pass
