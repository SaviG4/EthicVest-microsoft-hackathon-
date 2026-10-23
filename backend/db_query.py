import sys
import json
from database import get_connection

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query JSON provided"}))
        sys.exit(1)

    try:
        req = json.loads(sys.argv[1])
        sql = req.get("sql")
        params = req.get("params", [])
        is_write = req.get("write", False)

        conn = get_connection()
        cursor = conn.cursor()

        if is_write:
            cursor.execute(sql, params)
            conn.commit()
            last_id = cursor.lastrowid
            row_count = cursor.rowcount
            conn.close()
            print(json.dumps({"success": True, "lastrowid": last_id, "rowcount": row_count}))
        else:
            cursor.execute(sql, params)
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            print(json.dumps({"success": True, "rows": rows}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
