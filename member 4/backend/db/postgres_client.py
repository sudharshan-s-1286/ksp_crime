import os
import logging
import sqlite3
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("PostgresClient")

# Try importing psycopg2
HAS_PG = False
try:
    import psycopg2
    from psycopg2 import pool
    HAS_PG = True
except ImportError:
    logger.warning("psycopg2 not installed. PostgreSQL connections will run in SQLite fallback mode.")

class PostgresClient:
    """
    Production-ready PostgreSQL database client with thread-safe connection pooling.
    Falls back to SQLite for local development, testing, and offline modes.
    """
    _instance = None
    _connection_pool = None
    _sqlite_conn = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(PostgresClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.host = os.getenv("PGHOST", "localhost")
        self.port = os.getenv("PGPORT", "5432")
        self.database = os.getenv("PGDATABASE", "ksp_crime_db")
        self.user = os.getenv("PGUSER", "postgres")
        self.password = os.getenv("PGPASSWORD", "")
        
        self.use_pg = HAS_PG and os.getenv("USE_POSTGRES", "false").lower() == "true"

        if self.use_pg:
            try:
                logger.info(f"Initializing PostgreSQL connection pool on {self.host}:{self.port}...")
                self._connection_pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=2,
                    maxconn=10,
                    host=self.host,
                    port=self.port,
                    database=self.database,
                    user=self.user,
                    password=self.password
                )
                logger.info("PostgreSQL connection pool initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize PostgreSQL pool: {str(e)}. Switching to SQLite fallback.")
                self.use_pg = False

        if not self.use_pg:
            logger.info("Initializing PostgresClient in SQLite fallback mode.")
            # Create a shared SQLite connection to mock PostgreSQL
            self._sqlite_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._seed_sqlite_data()

    def _seed_sqlite_data(self):
        """
        Seeds the SQLite fallback database with relational tables.
        This mirrors the production PostgreSQL schema.
        """
        cursor = self._sqlite_conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crimes (
                crime_id TEXT PRIMARY KEY,
                fir_no TEXT,
                suspect_name TEXT,
                crime_type TEXT,
                district TEXT,
                lat REAL,
                lng REAL,
                case_status TEXT,
                occurrence_date TEXT,
                occurrence_time TEXT,
                modus_operandi TEXT
            )
        """)
        
        # Seed sample crimes
        sample_crimes = [
            ("C001", "FIR-2025-001", "Suresh Patil", "Burglary", "Mysore", 12.2958, 76.6394, "Under Investigation", "2025-01-15", "02:15", "Nocturnal entry via lockpicking. Night surveillance disguised as a technician."),
            ("C002", "FIR-2025-009", "Suresh Patil", "Burglary", "Mysore", 12.3082, 76.6450, "Chargesheet Filed", "2025-03-22", "03:40", "Targeted locked luxury house. Leveraged window latch bypass."),
            ("C003", "FIR-2025-018", "Suresh Patil", "Burglary", "Mangalore", 12.9141, 74.8560, "Under Investigation", "2025-06-10", "01:30", "Bypassed security gate. Conducted prior casing disguised as maintenance staff."),
            ("C004", "FIR-2025-002", "Ramesh Kumar", "Cyber Crime", "Bangalore Central", 12.9716, 77.5946, "Under Investigation", "2025-01-20", "11:00", "Phishing campaign spoofing local bank portals."),
            ("C005", "FIR-2025-005", "Ramesh Kumar", "Financial Fraud", "Bangalore Central", 12.9720, 77.5950, "Chargesheet Filed", "2025-02-14", "14:30", "Hawala transfers routed through textile shell corporations."),
            ("C006", "FIR-2025-011", "Dinesh Gowda", "Extortion", "Bangalore East", 12.9784, 77.6408, "Under Investigation", "2025-04-05", "16:45", "Intimidation of construction site managers for protection money."),
            ("C007", "FIR-2025-022", "Dinesh Gowda", "Extortion", "Bangalore East", 12.9800, 77.6420, "Arrested", "2025-07-12", "19:15", "Threats made to transport operators regarding sand transit permits.")
        ]
        
        cursor.executemany("INSERT OR REPLACE INTO crimes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", sample_crimes)
        self._sqlite_conn.commit()

    def execute_query(self, sql_query: str, params: Tuple = ()) -> List[Dict[str, Any]]:
        """
        Executes a SQL query. Safe for concurrent execution.
        """
        if self.use_pg:
            conn = self._connection_pool.getconn()
            try:
                # Use RealDictCursor to return key-value records
                from psycopg2.extras import RealDictCursor
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(sql_query, params)
                    return list(cursor.fetchall())
            except Exception as e:
                logger.error(f"PostgreSQL query execution failed: {str(e)}")
                conn.rollback()
                raise e
            finally:
                self._connection_pool.putconn(conn)
        else:
            # SQLite executes synchronously using the shared connection
            cursor = self._sqlite_conn.cursor()
            try:
                cursor.execute(sql_query, params)
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            except Exception as e:
                logger.error(f"SQLite query execution failed: {str(e)}")
                raise e
                
    def close(self):
        if self.use_pg and self._connection_pool:
            self._connection_pool.closeall()
        if self._sqlite_conn:
            self._sqlite_conn.close()
