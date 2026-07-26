import os
import sys
import json
import logging
import socketserver
import time
import queue
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler

# Ensure repository root is in sys.path for `from backend.xxx import xxx` imports
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_repo_root = os.path.abspath(os.path.join(_backend_dir, ".."))
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

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
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        print(f"DEBUG: do_GET called with path {path}", flush=True)
        from backend.telemetry.telemetry_manager import telemetry_manager

        # API Export and Generation Endpoints
        if path == "/api/export-records":
            try:
                from backend.rag.sql_retriever import SQLRetriever
                from backend.utils.pdf_generator import generate_records_pdf
                
                type_filter = query_params.get('type', ['All'])[0]
                dist_filter = query_params.get('district', ['All'])[0]
                search_query = query_params.get('search', [''])[0]
                
                retriever = SQLRetriever()
                query = "SELECT * FROM firs WHERE 1=1"
                params = []
                if type_filter != 'All':
                    query += " AND crime_type = ?"
                    params.append(type_filter)
                if dist_filter != 'All':
                    query += " AND district = ?"
                    params.append(dist_filter)
                if search_query:
                    query += " AND (fir_id LIKE ? OR suspect_name LIKE ? OR modus_operandi LIKE ?)"
                    q_val = f"%{search_query}%"
                    params.extend([q_val, q_val, q_val])
                    
                cursor = retriever.conn.cursor()
                cursor.execute(query, params)
                cols = [c[0] for c in cursor.description]
                records = [dict(zip(cols, row)) for row in cursor.fetchall()]
                
                pdf_bytes = generate_records_pdf(records, f"Type={type_filter}, District={dist_filter}, Search={search_query}")
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Disposition", "attachment; filename=ksp_crime_export.pdf")
                self.send_header("Content-Length", str(len(pdf_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(pdf_bytes)
            except Exception as e:
                logger.error(f"Error generating records PDF: {str(e)}")
                self.send_error(500, f"Error generating report: {str(e)}")
            return

        elif path == "/api/export-analytics":
            try:
                from backend.rag.sql_retriever import SQLRetriever
                from backend.utils.pdf_generator import generate_analytics_pdf
                
                period = query_params.get('period', ['Quarter'])[0]
                retriever = SQLRetriever()
                cursor = retriever.conn.cursor()
                
                # Crimes by type
                cursor.execute("SELECT crime_type as type, COUNT(*) as count FROM firs GROUP BY crime_type ORDER BY count DESC")
                crimes_by_type = [{"type": row[0], "count": row[1]} for row in cursor.fetchall()]
                
                # District Frequency
                cursor.execute("SELECT district, COUNT(*) as count FROM firs GROUP BY district ORDER BY count DESC")
                districts = cursor.fetchall()
                total_count = sum(row[1] for row in districts) or 1
                district_freq = [{"district": row[0], "count": row[1], "percentage": int((row[1]/total_count)*100)} for row in districts]
                
                # Time distribution
                cursor.execute("""
                    SELECT 
                        CASE 
                            WHEN occurrence_time >= '06:00' AND occurrence_time < '12:00' THEN 'Morning (06:00 - 12:00)'
                            WHEN occurrence_time >= '12:00' AND occurrence_time < '18:00' THEN 'Afternoon (12:00 - 18:00)'
                            WHEN occurrence_time >= '18:00' AND occurrence_time < '24:00' THEN 'Evening (18:00 - 24:00)'
                            ELSE 'Night (00:00 - 06:00)'
                        END as period,
                        COUNT(*) as count
                    FROM firs
                    GROUP BY period
                """)
                time_dist = [{"period": row[0], "count": row[1]} for row in cursor.fetchall()]
                
                pdf_bytes = generate_analytics_pdf(crimes_by_type, district_freq, time_dist, period)
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                self.send_header("Content-Disposition", "attachment; filename=ksp_crime_analytics.pdf")
                self.send_header("Content-Length", str(len(pdf_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(pdf_bytes)
            except Exception as e:
                logger.error(f"Error generating analytics PDF: {str(e)}")
                self.send_error(500, f"Error generating analytics report: {str(e)}")
            return

        elif path == "/api/beat-plan":
            try:
                zone = query_params.get('zone', ['Hebbal Sector'])[0]
                plan_text = f"""==================================================
KARNATAKA STATE POLICE — PREVENTIVE BEAT PLAN
==================================================
CONFIDENTIAL // FOR OFFICIAL POLICE DEPLOYMENT ONLY

TARGET ZONE: {zone.upper()}
AI RISK FACTOR OVERLAY: HIGH ALERT

---
1. PATROLLING INSTRUCTIONS & TIMES:
- Shift A (Day Beat): 08:00 to 16:00 hours. Focus on public transits and markets.
- Shift B (Evening Beat): 16:00 to 00:00 hours. Focus on tech commercial corridors.
- Shift C (Night/Nocturnal Beat): 00:00 to 08:00 hours. CRITICAL WINDOW: 02:00 - 04:30.

2. TARGET ROUTE CHECKPOINTS:
- Checkpoint 1: {zone} Toll Plaza grid points
- Checkpoint 2: Core commercial / residential sectors
- Checkpoint 3: Critical transport hubs and transit nodes
- Checkpoint 4: Peripheral border checkpoints

3. DESIGNATED PATROL OFFICERS:
- Sector Commander: Insp. R. Gowda (Badge #9981)
- Beat Officer 1: SI K. Patil
- Beat Officer 2: SI M. Hubli

4. CRITICAL ANOMALIES & MO PREVENTIVE TARGETS:
- Watch for lockpicking or window latch bypass attempts on locked residential blocks.
- Verify credentials of maintenance and service staff vehicles crossing the sector grid after dark.

System Generation: {time.strftime('%Y-%m-%d %H:%M:%S')}
KSP Forecast & Decision Support Platform
"""
                plan_bytes = plan_text.encode('utf-8')
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.send_header("Content-Disposition", f"attachment; filename=preventive_beat_plan_{zone.replace(' ', '_').lower()}.txt")
                self.send_header("Content-Length", str(len(plan_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(plan_bytes)
            except Exception as e:
                self.send_error(500, str(e))
            return

        elif path in ["/api/generate-report", "/api/download-report"]:
            try:
                from backend.rag.sql_retriever import SQLRetriever
                from backend.utils.pdf_generator import generate_compliance_report_pdf
                
                case = query_params.get('case', ['Suresh Patil Network'])[0]
                district = query_params.get('district', ['Bengaluru Central'])[0]
                fmt = query_params.get('format', ['Standard Secure PDF'])[0]
                name = query_params.get('name', [''])[0]
                
                # If downloading a specific report by name, infer parameters from the name
                if name:
                    if "Suresh Patil" in name:
                        case = "Suresh Patil Network"
                        district = "Mysore"
                    elif "Bengaluru Central" in name:
                        case = "All Cases"
                        district = "Bengaluru Central"
                    elif "Belagavi" in name:
                        case = "Belagavi Cyber Fraud"
                        district = "Belagavi Rural"
                
                retriever = SQLRetriever()
                cursor = retriever.conn.cursor()
                
                # Fetch matching FIRs
                query = "SELECT * FROM firs WHERE 1=1"
                params = []
                if "Suresh Patil" in case:
                    query += " AND suspect_name = ?"
                    params.append("Suresh Patil")
                elif "Belagavi" in case:
                    query += " AND crime_type = ?"
                    params.append("Cyber Crime")
                elif "Mysuru Smuggling" in case:
                    query += " AND district = ?"
                    params.append("Mysore")
                    
                if district != 'All Districts' and district != 'All':
                    # Map UI districts to seeded DB districts if needed
                    db_district = district
                    if district == "Bengaluru Central":
                        db_district = "Bangalore Central"
                    query += " AND district = ?"
                    params.append(db_district)
                    
                cursor.execute(query, params)
                cols = [c[0] for c in cursor.description]
                records = [dict(zip(cols, row)) for row in cursor.fetchall()]
                
                pdf_bytes = generate_compliance_report_pdf(case, district, fmt, records)
                self.send_response(200)
                self.send_header("Content-Type", "application/pdf")
                filename = name if name else f"ksp_intelligence_report_{int(time.time())}.pdf"
                self.send_header("Content-Disposition", f"attachment; filename=\"{filename}\"")
                self.send_header("Content-Length", str(len(pdf_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(pdf_bytes)
            except Exception as e:
                logger.error(f"Error generating compliance report: {str(e)}")
                self.send_error(500, f"Error: {str(e)}")
            return

        elif path == "/api/dossiers":
            try:
                from backend.rag.sql_retriever import SQLRetriever
                retriever = SQLRetriever()
                cursor = retriever.conn.cursor()
                cursor.execute("SELECT * FROM suspect_dossiers")
                cols = [c[0] for c in cursor.description]
                rows = cursor.fetchall()
                dossiers = [dict(zip(cols, row)) for row in rows]
                self._send_json(dossiers)
            except Exception as e:
                logger.error(f"Error fetching dossiers: {str(e)}")
                self.send_error(500, str(e))
            return

        # API Telemetry Endpoints
        elif path == "/api/telemetry":
            print("DEBUG: entering /api/telemetry", flush=True)
            self._send_json(telemetry_manager.get_full_telemetry())
            print("DEBUG: exiting /api/telemetry", flush=True)
            return
        elif path == "/api/system":
            self._send_json(telemetry_manager.get_system_metrics())
            return
        elif path == "/api/agents":
            self._send_json(telemetry_manager.agents_metrics)
            return
        elif self.path == "/api/pipeline":
            self._send_json({
                "current_active_query": telemetry_manager.current_active_query,
                "current_pipeline_stage": telemetry_manager.current_pipeline_stage,
                "stages": telemetry_manager.pipeline_stages
            })
            return
        elif self.path == "/api/logs":
            self._send_json(telemetry_manager.logs)
            return
        elif self.path == "/api/telemetry/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            sub_queue = telemetry_manager.register_subscriber()
            try:
                # Send initial snapshot immediately
                init_evt = f"data: {json.dumps({'type': 'init', 'data': telemetry_manager.get_full_telemetry()})}\n\n"
                self.wfile.write(init_evt.encode('utf-8'))
                self.wfile.flush()
                
                # Stream events for 30 seconds or until client disconnects
                start_stream = time.time()
                while time.time() - start_stream < 30:
                    try:
                        event = sub_queue.get(timeout=1.0)
                        msg = f"data: {json.dumps(event)}\n\n"
                        self.wfile.write(msg.encode('utf-8'))
                        self.wfile.flush()
                    except queue.Empty:
                        # Heartbeat
                        hb = f"data: {json.dumps({'type': 'heartbeat', 'data': telemetry_manager.get_system_metrics()})}\n\n"
                        self.wfile.write(hb.encode('utf-8'))
                        self.wfile.flush()
            except Exception as e:
                logger.debug(f"SSE stream disconnected: {str(e)}")
            finally:
                telemetry_manager.unregister_subscriber(sub_queue)
            return

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
        from urllib.parse import urlparse
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Handle dossier registration
        if path == "/api/dossiers":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                name = payload.get("name")
                alias = payload.get("alias")
                status = payload.get("status")
                risk = int(payload.get("risk", 50))
                age = int(payload.get("age", 30))
                clearance = payload.get("clearance", "Restricted")
                arrests = int(payload.get("arrests", 0))
                convictions = int(payload.get("convictions", 0))
                modus_operandi = payload.get("modus_operandi", "")
                psychological_brief = payload.get("psychological_brief", "")
                
                if not name:
                    self._send_json({"status": "error", "error_message": "Name is required"}, status_code=400)
                    return
                
                from backend.rag.sql_retriever import SQLRetriever
                retriever = SQLRetriever()
                cursor = retriever.conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO suspect_dossiers (
                        name, alias, status, risk, age, clearance, arrests, convictions, modus_operandi, psychological_brief
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (name, alias, status, risk, age, clearance, arrests, convictions, modus_operandi, psychological_brief))
                retriever.conn.commit()
                
                self._send_json({"status": "success", "message": f"Dossier for {name} registered successfully."})
            except Exception as e:
                logger.error(f"Error saving dossier: {str(e)}")
                self._send_json({"status": "error", "error_message": str(e)}, status_code=500)
            return

        # 2. Handle API chat requests
        elif path == "/api/chat":
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
                    "agent_results": pipeline_output.data
                }
                
                # If pipeline populated results, attach them directly for visual widgets
                if pipeline.memory.sessions.get(session_id):
                    try:
                        # Gather the latest outputs that were ran
                        profiling_res = pipeline_output.data.get("profiling", {})
                        if profiling_res:
                            response_data["profiling"] = profiling_res
                    except Exception:
                        pass
                     
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
                    try:
                        from backend.contracts.agent_schemas import AgentInput
                        forecast_output = pipeline.agent_registry["forecast_agent"].run(
                            AgentInput(query="forecast", context={})
                        )
                        response_data["forecasts"] = forecast_output.data.get("forecasts", {})
                        response_data["alerts"] = forecast_output.data.get("alerts", [])
                    except Exception:
                        response_data["forecasts"] = {}
                        response_data["alerts"] = []

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
    port = int(os.getenv("X_ZOHO_CATALYST_LISTEN_PORT", os.getenv("PORT", "8000")))
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    logger.info(f"KSP Crime Copilot running on port {port}")
    run_server(port)
