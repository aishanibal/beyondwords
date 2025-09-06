#!/usr/bin/env python3
"""
Migration script to move data from SQLite to Supabase
"""

import sqlite3
import json
import os
import sys
from supabase import create_client, Client
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def get_supabase_client():
    """Initialize Supabase client"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ ERROR: Missing Supabase environment variables")
        print(f"SUPABASE_URL: {'✓' if url else '✗'}")
        print(f"SUPABASE_SERVICE_ROLE_KEY: {'✓' if key else '✗'}")
        sys.exit(1)
    
    return create_client(url, key)

def migrate_users(sqlite_cursor, supabase: Client):
    """Migrate users from SQLite to Supabase"""
    print("🔄 Migrating users...")
    
    sqlite_cursor.execute("SELECT * FROM users")
    users = sqlite_cursor.fetchall()
    
    # Get column names
    sqlite_cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in sqlite_cursor.fetchall()]
    
    migrated_count = 0
    for user_row in users:
        user_dict = dict(zip(columns, user_row))
        
        # Convert SQLite data to Supabase format
        supabase_user = {
            "id": str(user_dict["id"]),  # Convert to string for Supabase
            "email": user_dict["email"],
            "name": user_dict["name"],
            "role": user_dict["role"],
            "onboarding_complete": bool(user_dict["onboarding_complete"]),
            "created_at": user_dict["created_at"],
            "updated_at": user_dict["updated_at"]
        }
        
        # Add optional fields if they exist
        if user_dict.get("google_id"):
            supabase_user["google_id"] = user_dict["google_id"]
        if user_dict.get("password_hash"):
            supabase_user["password_hash"] = user_dict["password_hash"]
        if user_dict.get("target_language"):
            supabase_user["target_language"] = user_dict["target_language"]
        if user_dict.get("proficiency_level"):
            supabase_user["proficiency_level"] = user_dict["proficiency_level"]
        if user_dict.get("talk_topics"):
            try:
                supabase_user["talk_topics"] = json.loads(user_dict["talk_topics"])
            except:
                supabase_user["talk_topics"] = []
        if user_dict.get("learning_goals"):
            try:
                supabase_user["learning_goals"] = json.loads(user_dict["learning_goals"])
            except:
                supabase_user["learning_goals"] = []
        if user_dict.get("practice_preference"):
            supabase_user["practice_preference"] = user_dict["practice_preference"]
        if user_dict.get("preferences"):
            supabase_user["preferences"] = user_dict["preferences"]
        
        try:
            # Try to insert user
            result = supabase.table("users").insert(supabase_user).execute()
            print(f"✅ Migrated user: {user_dict['email']}")
            migrated_count += 1
        except Exception as e:
            if "duplicate key" in str(e).lower():
                print(f"⚠️  User already exists: {user_dict['email']}")
            else:
                print(f"❌ Failed to migrate user {user_dict['email']}: {e}")
    
    print(f"📊 Users migration complete: {migrated_count} users migrated")
    return migrated_count

def migrate_language_dashboards(sqlite_cursor, supabase: Client):
    """Migrate language dashboards from SQLite to Supabase"""
    print("🔄 Migrating language dashboards...")
    
    sqlite_cursor.execute("SELECT * FROM language_dashboards")
    dashboards = sqlite_cursor.fetchall()
    
    # Get column names
    sqlite_cursor.execute("PRAGMA table_info(language_dashboards)")
    columns = [column[1] for column in sqlite_cursor.fetchall()]
    
    migrated_count = 0
    for dashboard_row in dashboards:
        dashboard_dict = dict(zip(columns, dashboard_row))
        
        # Convert SQLite data to Supabase format
        supabase_dashboard = {
            "user_id": str(dashboard_dict["user_id"]),  # Convert to string for Supabase
            "language": dashboard_dict["language"],
            "proficiency_level": dashboard_dict["proficiency_level"],
            "practice_preference": dashboard_dict["practice_preference"],
            "feedback_language": dashboard_dict["feedback_language"],
            "speak_speed": dashboard_dict["speak_speed"],
            "romanization_display": dashboard_dict["romanization_display"],
            "is_primary": bool(dashboard_dict["is_primary"]),
            "created_at": dashboard_dict["created_at"],
            "updated_at": dashboard_dict["updated_at"]
        }
        
        # Parse JSON fields
        if dashboard_dict.get("talk_topics"):
            try:
                supabase_dashboard["talk_topics"] = json.loads(dashboard_dict["talk_topics"])
            except:
                supabase_dashboard["talk_topics"] = []
        else:
            supabase_dashboard["talk_topics"] = []
            
        if dashboard_dict.get("learning_goals"):
            try:
                supabase_dashboard["learning_goals"] = json.loads(dashboard_dict["learning_goals"])
            except:
                supabase_dashboard["learning_goals"] = []
        else:
            supabase_dashboard["learning_goals"] = []
        
        try:
            # Try to insert dashboard
            result = supabase.table("language_dashboards").insert(supabase_dashboard).execute()
            print(f"✅ Migrated dashboard: {dashboard_dict['language']} for user {dashboard_dict['user_id']}")
            migrated_count += 1
        except Exception as e:
            if "duplicate key" in str(e).lower():
                print(f"⚠️  Dashboard already exists: {dashboard_dict['language']} for user {dashboard_dict['user_id']}")
            else:
                print(f"❌ Failed to migrate dashboard: {e}")
    
    print(f"📊 Language dashboards migration complete: {migrated_count} dashboards migrated")
    return migrated_count

def migrate_conversations(sqlite_cursor, supabase: Client):
    """Migrate conversations from SQLite to Supabase"""
    print("🔄 Migrating conversations...")
    
    sqlite_cursor.execute("SELECT * FROM conversations")
    conversations = sqlite_cursor.fetchall()
    
    # Get column names
    sqlite_cursor.execute("PRAGMA table_info(conversations)")
    columns = [column[1] for column in sqlite_cursor.fetchall()]
    
    migrated_count = 0
    for conv_row in conversations:
        conv_dict = dict(zip(columns, conv_row))
        
        # Convert SQLite data to Supabase format
        supabase_conversation = {
            "user_id": str(conv_dict["user_id"]),
            "title": conv_dict.get("title"),
            "synopsis": conv_dict.get("synopsis"),
            "formality": conv_dict.get("formality"),
            "description": conv_dict.get("description"),
            "message_count": conv_dict.get("message_count", 0),
            "uses_persona": bool(conv_dict.get("uses_persona", False)),
            "created_at": conv_dict["created_at"],
            "updated_at": conv_dict["updated_at"]
        }
        
        # Add optional fields
        if conv_dict.get("language_dashboard_id"):
            supabase_conversation["language_dashboard_id"] = conv_dict["language_dashboard_id"]
        if conv_dict.get("persona_id"):
            supabase_conversation["persona_id"] = conv_dict["persona_id"]
        if conv_dict.get("progress_data"):
            supabase_conversation["progress_data"] = conv_dict["progress_data"]
        
        # Parse JSON fields
        if conv_dict.get("topics"):
            try:
                supabase_conversation["topics"] = json.loads(conv_dict["topics"])
            except:
                supabase_conversation["topics"] = []
        
        if conv_dict.get("learning_goals"):
            try:
                supabase_conversation["learning_goals"] = json.loads(conv_dict["learning_goals"])
            except:
                supabase_conversation["learning_goals"] = []
        
        try:
            # Try to insert conversation
            result = supabase.table("conversations").insert(supabase_conversation).execute()
            print(f"✅ Migrated conversation: {conv_dict.get('title', 'Untitled')} (ID: {conv_dict['id']})")
            migrated_count += 1
        except Exception as e:
            print(f"❌ Failed to migrate conversation {conv_dict['id']}: {e}")
    
    print(f"📊 Conversations migration complete: {migrated_count} conversations migrated")
    return migrated_count

def migrate_messages(sqlite_cursor, supabase: Client):
    """Migrate messages from SQLite to Supabase"""
    print("🔄 Migrating messages...")
    
    sqlite_cursor.execute("SELECT * FROM messages ORDER BY conversation_id, message_order")
    messages = sqlite_cursor.fetchall()
    
    # Get column names
    sqlite_cursor.execute("PRAGMA table_info(messages)")
    columns = [column[1] for column in sqlite_cursor.fetchall()]
    
    migrated_count = 0
    batch_size = 50  # Supabase batch insert limit
    message_batch = []
    
    for msg_row in messages:
        msg_dict = dict(zip(columns, msg_row))
        
        # Convert SQLite data to Supabase format
        supabase_message = {
            "conversation_id": msg_dict["conversation_id"],
            "sender": msg_dict["sender"],
            "text": msg_dict["text"],
            "message_type": msg_dict.get("message_type", "text"),
            "message_order": msg_dict["message_order"],
            "created_at": msg_dict["created_at"]
        }
        
        # Add optional fields
        if msg_dict.get("romanized_text"):
            supabase_message["romanized_text"] = msg_dict["romanized_text"]
        if msg_dict.get("audio_file_path"):
            supabase_message["audio_file_path"] = msg_dict["audio_file_path"]
        if msg_dict.get("detailed_feedback"):
            supabase_message["detailed_feedback"] = msg_dict["detailed_feedback"]
        
        message_batch.append(supabase_message)
        
        # Insert in batches
        if len(message_batch) >= batch_size:
            try:
                result = supabase.table("messages").insert(message_batch).execute()
                print(f"✅ Migrated batch of {len(message_batch)} messages")
                migrated_count += len(message_batch)
                message_batch = []
            except Exception as e:
                print(f"❌ Failed to migrate message batch: {e}")
                message_batch = []
    
    # Insert remaining messages
    if message_batch:
        try:
            result = supabase.table("messages").insert(message_batch).execute()
            print(f"✅ Migrated final batch of {len(message_batch)} messages")
            migrated_count += len(message_batch)
        except Exception as e:
            print(f"❌ Failed to migrate final message batch: {e}")
    
    print(f"📊 Messages migration complete: {migrated_count} messages migrated")
    return migrated_count

def main():
    """Main migration function"""
    print("🚀 Starting SQLite to Supabase migration...")
    
    # Connect to SQLite database
    try:
        sqlite_conn = sqlite3.connect('users.db')
        sqlite_cursor = sqlite_conn.cursor()
        print("✅ Connected to SQLite database")
    except Exception as e:
        print(f"❌ Failed to connect to SQLite database: {e}")
        sys.exit(1)
    
    # Connect to Supabase
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)
    
    # Run migrations
    total_migrated = 0
    
    try:
        # Migrate users first (required for foreign keys)
        total_migrated += migrate_users(sqlite_cursor, supabase)
        
        # Migrate language dashboards
        total_migrated += migrate_language_dashboards(sqlite_cursor, supabase)
        
        # Migrate conversations
        total_migrated += migrate_conversations(sqlite_cursor, supabase)
        
        # Migrate messages
        total_migrated += migrate_messages(sqlite_cursor, supabase)
        
        print(f"\n🎉 Migration completed successfully!")
        print(f"📊 Total records migrated: {total_migrated}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        sqlite_conn.close()
        print("🔒 SQLite connection closed")

if __name__ == "__main__":
    main()
