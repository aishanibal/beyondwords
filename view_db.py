import sqlite3
try:
    from tabulate import tabulate
    use_tabulate = True
except ImportError:
    use_tabulate = False

conn = sqlite3.connect('server/users.db')
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in database:")
if use_tabulate:
    print(tabulate(tables, headers=["Table Name"]))
else:
    for t in tables:
        print(f"- {t[0]}")

print("\n" + "="*50 + "\n")

# View data from each table
for table_name in [t[0] for t in tables]:
    print(f"=== {table_name.upper()} TABLE ===")
    
    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [col[1] for col in cursor.fetchall()]
    
    # Get sample data (limit to 5 rows)
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
    rows = cursor.fetchall()
    
    if rows:
        print(f"Columns: {columns}")
        print(f"Found {len(rows)} rows:")
        if use_tabulate:
            print(tabulate(rows, headers=columns))
        else:
            for i, row in enumerate(rows, 1):
                print(f"Row {i}: {row}")
    else:
        print("No data found")
    
    print("\n" + "-"*30 + "\n")

# Special view for conversations with message counts
print("=== CONVERSATIONS WITH MESSAGE COUNTS ===")
cursor.execute("""
    SELECT 
        c.id,
        c.title,
        ld.language,
        c.message_count,
        u.name as user_name,
        c.created_at,
        c.updated_at
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    JOIN language_dashboards ld ON c.language_dashboard_id = ld.id
    ORDER BY c.updated_at DESC
    LIMIT 10
""")
conversations = cursor.fetchall()
if conversations:
    columns = ["ID", "Title", "Language", "Message Count", "User", "Created", "Updated"]
    if use_tabulate:
        print(tabulate(conversations, headers=columns))
    else:
        for conv in conversations:
            print(f"Conversation {conv[0]}: {conv[1]} ({conv[2]}) - {conv[3]} messages by {conv[4]}")
else:
    print("No conversations found")

print("\n" + "="*50 + "\n")

# Show recent messages
print("=== RECENT MESSAGES ===")
cursor.execute("""
    SELECT 
        m.id,
        m.sender,
        m.text,
        m.message_type,
        m.message_order,
        c.title as conversation_title,
        m.created_at
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 10
""")
messages = cursor.fetchall()
if messages:
    columns = ["ID", "Sender", "Text", "Type", "Order", "Conversation", "Created"]
    if use_tabulate:
        print(tabulate(messages, headers=columns))
    else:
        for msg in messages:
            # Truncate long text for display
            text = msg[2][:50] + "..." if len(msg[2]) > 50 else msg[2]
            print(f"Message {msg[0]}: {msg[1]} - {text} (in {msg[5]})")
else:
    print("No messages found")

conn.close()