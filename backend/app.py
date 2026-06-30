import os
import json
import logging
import socketserver
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from backend.orchestration.pipeline import CopilotPipeline

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("WebServer")

# Initialize the central pipeline
pipeline = CopilotPipeline()

class CopilotHTTPHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler that serves the static dashboard HTML
    and exposes a REST API for the multi-agent pipeline.
    """
    def do_GET(self):
        # 1. Serve index.html at root
        if self.path == "/" or self.path == "/index.html":
            self._serve_file("backend/static/index.html", "text/html")
        else:
            # Prevent directory traversal attacks
            safe_path = self.path.lstrip("/")
            if ".." in safe_path:
                self.send_error(400, "Bad Request")
                return
                
            local_path = os.path.join("backend/static", safe_path)
            if os.path.exists(local_path) and os.path.isfile(local_path):
                # Determine content type
                content_type = "text/plain"
                if local_path.endswith(".html"):
                    content_type = "text/html"
                elif local_path.endswith(".css"):
                    content_type = "text/css"
                elif local_path.endswith(".js"):
                    content_type = "application/javascript"
                elif local_path.endswith(".json"):
                    content_type = "application/json"
                elif local_path.endswith(".png"):
                    content_type = "image/png"
                    
                self._serve_file(local_path, content_type)
            else:
                self.send_error(404, "File Not Found")

    def do_POST(self):
        # 2. Handle API chat requests
        if self.path == "/api/chat":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                query = payload.get("query", "")
                role = payload.get("role", "Investigator")
                session_id = payload.get("session_id", "web_session_default")
                context = payload.get("context", {})
                
                logger.info(f"API request received: Session='{session_id}' | Role='{role}' | Query='{query[:40]}...'")
                
                # Execute the multi-agent pipeline
                pipeline_output = pipeline.execute(
                    session_id=session_id,
                    query=query,
                    role=role,
                    context=context
                )
                
                # Extract and prepare the response payload
                # Include all individual agent results to display in the UI
                response_data = {
                    "status": "success",
                    "role_filtered": pipeline_output.data.get("role_filtered", True),
                    "applied_role": pipeline_output.data.get("applied_role", role),
                    "markdown_response": pipeline_output.data.get("markdown_response", ""),
                    # Share individual agent data blocks for dashboard widgets
                    "agent_results": pipeline.memory.sessions.get(session_id, []) # session history
                }
                
                # If pipeline populated results, attach them directly for visual widgets
                # We can inject current agent results from the last run to update charts
                if pipeline.memory.sessions.get(session_id):
                    # Gather the latest outputs that were ran
                    response_data["profiling"] = pipeline.agent_registry["profiling_agent"].sql_retriever.get_firs_by_suspect("Suresh Patil")
                    
                    # Run a quick analytics query to feed the charts
                    sql_ret = pipeline.agent_registry["analytics_agent"].sql_retriever
                    
                    # 1. Hotspots
                    hotspots = sql_ret.retrieve("SELECT lat, lng, district, COUNT(*) as incident_count FROM firs GROUP BY lat, lng, district ORDER BY incident_count DESC")
                    response_data["hotspots"] = [h["data"] for h in hotspots]
                    
                    # 2. Time distribution
                    time_dist = sql_ret.retrieve("""
                        SELECT 
                            CASE 
                                WHEN occurrence_time >= '06:00' AND occurrence_time < '12:00' THEN 'Morning'
                                WHEN occurrence_time >= '12:00' AND occurrence_time < '18:00' THEN 'Afternoon'
                                WHEN occurrence_time >= '18:00' AND occurrence_time < '24:00' THEN 'Evening'
                                ELSE 'Night'
                            END as time_bucket,
                            COUNT(*) as count
                        FROM firs
                        GROUP BY time_bucket
                    """)
                    response_data["time_distribution"] = {t["data"]["time_bucket"]: t["data"]["count"] for t in time_dist}
                    
                    # 3. Forecasts
                    forecast_output = pipeline.agent_registry["forecast_agent"].run({
                        "query": "forecast",
                        "context": {}
                    })
                    response_data["forecasts"] = forecast_output.data.get("forecasts", {})
                    response_data["alerts"] = forecast_output.data.get("alerts", [])

                # Return response
                self._send_json(response_data)
                
            except Exception as e:
                logger.exception(f"Error handling POST request: {str(e)}")
                self._send_json({
                    "status": "error",
                    "error_message": str(e)
                }, status_code=500)
        else:
            self.send_error(404, "Endpoint Not Found")

    def _serve_file(self, file_path: str, content_type: str):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            # Enable CORS for easy local testing
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            logger.error(f"Error serving file '{file_path}': {str(e)}")
            self.send_error(500, "Internal Server Error")

    def _send_json(self, data: Dict[str, Any], status_code: int = 200):
        try:
            response = json.dumps(data).encode('utf-8')
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response)
        except Exception as e:
            logger.error(f"Error sending JSON response: {str(e)}")

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    """
    Multi-threaded HTTP server that handles concurrent requests asynchronously,
    preventing UI freezes during long-running multi-agent pipelines.
    """
    daemon_threads = True

def run_server(port: int = 8000):
    server_address = ('', port)
    httpd = ThreadingHTTPServer(server_address, CopilotHTTPHandler)
    logger.info(f"KSP Crime Copilot Dashboard Server running at: http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server shutting down.")
        httpd.server_close()

if __name__ == "__main__":
    import sys
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
