import sqlite3
import logging
from typing import List, Dict, Any, Union

logger = logging.getLogger("SQLRetriever")

class SQLRetriever:
    """
    RAG retriever that queries an in-memory SQLite database populated with realistic 
    Karnataka State Police (KSP) FIR records, monthly crime stats, and district demographics.
    """
    _db_conn = None

    def __init__(self):
        if SQLRetriever._db_conn is None:
            SQLRetriever._db_conn = sqlite3.connect(":memory:", check_same_thread=False)
            self.conn = SQLRetriever._db_conn
            self._seed_database()
        else:
            self.conn = SQLRetriever._db_conn

    def _seed_database(self):
        """
        Creates and seeds database tables with realistic test data.
        """
        logger.info("Initializing in-memory SQLite database and seeding tables.")
        cursor = self.conn.cursor()

        # 1. Create FIRs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS firs (
                fir_id TEXT PRIMARY KEY,
                suspect_name TEXT,
                crime_type TEXT,
                district TEXT,
                lat REAL,
                lng REAL,
                case_status TEXT,
                occurrence_date TEXT, -- YYYY-MM-DD
                occurrence_time TEXT, -- HH:MM
                modus_operandi TEXT
            )
        """)

        # 2. Create District Population table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS populations (
                district TEXT PRIMARY KEY,
                population INTEGER
            )
        """)

        # 3. Create Monthly Crime Stats table (for forecasting, 24 months)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS monthly_stats (
                year_month TEXT, -- YYYY-MM
                crime_type TEXT,
                crime_count INTEGER
            )
        """)

        # Seed Populations
        populations_data = [
            ("Bangalore East", 1200000),
            ("Bangalore Central", 950000),
            ("Mysore", 600000),
            ("Mangalore", 450000),
            ("Shivajinagar", 350000)
        ]
        cursor.executemany("INSERT INTO populations VALUES (?, ?)", populations_data)

        # Seed FIRs
        # We need a seeded person with 3+ FIRs: "Suresh Patil"
        firs_data = [
            # Suresh Patil FIRs
            ("FIR-2025-001", "Suresh Patil", "Burglary", "Mysore", 12.2958, 76.6394, "Under Investigation", "2025-01-15", "02:15", "Nocturnal entry via lockpicking. Night surveillance disguised as a technician."),
            ("FIR-2025-009", "Suresh Patil", "Burglary", "Mysore", 12.3082, 76.6450, "Chargesheet Filed", "2025-03-22", "03:40", "Targeted locked luxury house. Leveraged window latch bypass."),
            ("FIR-2025-018", "Suresh Patil", "Burglary", "Mangalore", 12.9141, 74.8560, "Under Investigation", "2025-06-10", "01:30", "Bypassed security gate. Conducted prior casing disguised as maintenance staff."),
            # Other suspect FIRs
            ("FIR-2025-002", "Ramesh Kumar", "Cyber Crime", "Bangalore Central", 12.9716, 77.5946, "Under Investigation", "2025-01-20", "11:00", "Phishing campaign spoofing local bank portals."),
            ("FIR-2025-005", "Ramesh Kumar", "Financial Fraud", "Bangalore Central", 12.9720, 77.5950, "Chargesheet Filed", "2025-02-14", "14:30", "Hawala transfers routed through textile shell corporations."),
            ("FIR-2025-011", "Dinesh Gowda", "Extortion", "Bangalore East", 12.9784, 77.6408, "Under Investigation", "2025-04-05", "16:45", "Intimidation of construction site managers for protection money."),
            ("FIR-2025-022", "Dinesh Gowda", "Extortion", "Bangalore East", 12.9800, 77.6420, "Arrested", "2025-07-12", "19:15", "Threats made to transport operators regarding sand transit permits."),
            # General crime records for hotspots and time of day calculations
            ("FIR-2025-003", "Anil K.", "Theft", "Shivajinagar", 12.9856, 77.6056, "Closed", "2025-01-25", "20:30", "Pickpocketing near public transit node."),
            ("FIR-2025-004", "Unknown", "Assault", "Shivajinagar", 12.9860, 77.6060, "Under Investigation", "2025-02-02", "22:15", "Physical altercation outside commercial venue."),
            ("FIR-2025-006", "Unknown", "Theft", "Shivajinagar", 12.9858, 77.6058, "Under Investigation", "2025-02-18", "21:00", "Bicycle theft from residential parking slot."),
            ("FIR-2025-007", "Unknown", "Assault", "Shivajinagar", 12.9862, 77.6062, "Under Investigation", "2025-03-01", "23:00", "Street fight involving multiple youths."),
            ("FIR-2025-008", "Unknown", "Cyber Crime", "Bangalore Central", 12.9710, 77.5930, "Under Investigation", "2025-03-10", "15:00", "Card skimming at commercial terminal."),
            ("FIR-2025-010", "Unknown", "Theft", "Mysore", 12.2950, 76.6380, "Closed", "2025-03-30", "09:15", "Shoplifting from retail mall."),
            ("FIR-2025-012", "Unknown", "Burglary", "Mysore", 12.2960, 76.6400, "Under Investigation", "2025-04-12", "03:00", "Forced entry through rear door of retail outlet.")
        ]
        cursor.executemany("INSERT INTO firs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", firs_data)

        # Seed Monthly Crime Stats (Last 24 Months, e.g. July 2024 to June 2026)
        # We will seed 3 crime types: "Burglary", "Cyber Crime", "Theft"
        monthly_data = []
        months = [
            "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
            "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
            "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
            "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"
        ]
        
        # Burglary trend: rising slowly (20, 21, 22... with minor noise)
        for idx, month in enumerate(months):
            count = 15 + idx + (idx % 3 - 1)  # Linear increase + noise
            monthly_data.append((month, "Burglary", count))

        # Cyber Crime trend: sharp rise (10, 12, 14... with a huge spike in the last months)
        for idx, month in enumerate(months):
            count = 8 + 2 * idx + (idx % 2 * 3)  # Strong linear increase
            # Seed a high value in recent months to trigger forecast alert
            if idx >= 21:  # Last 3 months
                count += 15
            monthly_data.append((month, "Cyber Crime", count))

        # Theft trend: stable with seasonal variance (30, 32, 28, 30... stable mean)
        for idx, month in enumerate(months):
            count = 30 + (idx % 4) * 4 - 6  # Oscillates around 28-34
            monthly_data.append((month, "Theft", count))

        cursor.executemany("INSERT INTO monthly_stats VALUES (?, ?, ?)", monthly_data)
        
        self.conn.commit()

    def retrieve(self, sql_query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """
        Executes a SQL query against the in-memory database and returns the results.
        Supports both raw SQL and parameterized execution.
        """
        cursor = self.conn.cursor()
        try:
            cursor.execute(sql_query, params)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # Formulate source chunks representation
            chunks = [{
                "source": "sql_retriever",
                "query": sql_query,
                "row_index": idx,
                "data": row
            } for idx, row in enumerate(results)]
            
            return chunks
        except Exception as e:
            logger.error(f"SQL execution error: {str(e)} | Query: {sql_query}")
            raise e
            
    def get_firs_by_suspect(self, suspect_name: str) -> List[Dict[str, Any]]:
        """
        Helper method to retrieve all FIRs for a suspect name (case-insensitive).
        """
        query = "SELECT * FROM firs WHERE LOWER(suspect_name) = LOWER(?)"
        return [chunk["data"] for chunk in self.retrieve(query, (suspect_name,))]
