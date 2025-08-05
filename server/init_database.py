#!/usr/bin/env python3
"""
Database initialization script for BeyondWords
This script creates the database with the correct schema
"""

import sqlite3
import os
import json

def init_database():
    """Initialize the database with the correct schema"""
    
    # Database file path
    db_path = 'users.db'
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Read and execute schema
    with open('schema.sql', 'r') as f:
        schema = f.read()
        cursor.executescript(schema)
    
    print("Database schema created successfully!")
    
    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Created tables: {[table[0] for table in tables]}")
    
    # Add some sample data for testing
    add_sample_data(cursor)
    
    conn.commit()
    conn.close()
    print("Database initialization complete!")

def add_sample_data(cursor):
    """Add sample data for testing"""
    
    # Add a sample user
    cursor.execute("""
        INSERT INTO users (email, name, role, target_language, proficiency_level, onboarding_complete)
        VALUES (?, ?, ?, ?, ?, ?)
    """, ('test@example.com', 'Test User', 'user', 'en', 'beginner', True))
    
    user_id = cursor.lastrowid
    
    # Add a language dashboard
    cursor.execute("""
        INSERT INTO language_dashboards (user_id, language, proficiency_level, talk_topics, learning_goals, practice_preference, feedback_language, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, 'en', 'beginner', json.dumps(['daily_conversation']), json.dumps(['pronunciation']), 'conversational', 'en', True))
    
    dashboard_id = cursor.lastrowid
    
    # Add a sample conversation
    cursor.execute("""
        INSERT INTO conversations (user_id, language_dashboard_id, title, topics, formality, message_count)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, dashboard_id, 'Sample Conversation', json.dumps(['daily_conversation']), 'friendly', 0))
    
    conversation_id = cursor.lastrowid
    
    print(f"Added sample data: User ID {user_id}, Dashboard ID {dashboard_id}, Conversation ID {conversation_id}")

if __name__ == "__main__":
    init_database() 