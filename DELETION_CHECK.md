# Codebase Deletion Check & Remaining Files to Delete

## ✅ Good News: Core Files Are Intact

All required core application files are present:
- ✅ `python_api.py` - Main API (REQUIRED)
- ✅ `gemini_client.py` - AI client (REQUIRED, imported by python_api.py)
- ✅ `gemini_transcription.py` - Transcription (REQUIRED, imported by python_api.py)
- ✅ `gemini_tts_synthesizer.py` - TTS synthesizer (REQUIRED)
- ✅ `tts_synthesizer_admin_controlled.py` - Admin TTS (REQUIRED, imported by python_api.py)
- ✅ `admin_dashboard.py` - Admin dashboard (REQUIRED, imported by tts_synthesizer_admin_controlled.py)
- ✅ `google_cloud_tts_simple.py` - Google Cloud TTS (REQUIRED, imported by tts_synthesizer_admin_controlled.py)
- ✅ `admin_config.json` - Admin config (REQUIRED)
- ✅ `templates/admin_dashboard.html` - Admin template (REQUIRED, used by python_api.py)
- ✅ `templates/login.html` - Login template (if used)

## 🗑️ Files That Can Still Be Deleted

### 1. **Utility Scripts** (Not Used in Production)
- `fix_password.py` - One-time password fix utility (57 lines)
  - **Status**: Safe to delete - only used for fixing admin password once

### 2. **Database Files** (Local Development Only)
- `server/database.sqlite` - Local SQLite database
  - **Status**: Safe to delete - production uses Supabase, not SQLite
  - **Note**: This is a local dev file, not needed for production

### 3. **Test Audio Files** (Development/Testing)
- `tts_output/ollama_response.aiff` - Test TTS output
- `tts_output/test_say.aiff` - Test audio file
- `audio_files/text_audio.mp3` - Test audio file
  - **Status**: Safe to delete - these are test files
  - **Note**: The directories themselves might be needed, but the test files can go

### 4. **Old SQL Files** (If Migration Complete)
- `export.sql` - Database export (4.6KB)
- `cleanup_progress_data.sql` - Cleanup script (901B)
- `supabase_setup.sql` - Setup script (7.3KB)
  - **Status**: Review - Keep `supabase_setup.sql` if you need it for new deployments
  - **Status**: Safe to delete `export.sql` and `cleanup_progress_data.sql` if migration is complete

### 5. **Python Cache** (Auto-regenerated)
- `__pycache__/` - Python bytecode cache
  - **Status**: Safe to delete - automatically regenerated

### 6. **Old Server Files** (If Not Used)
- `server/database.ts.old` - Old database file
- `server/init_database.py` - Database initialization (if Supabase migration complete)
- `server/migrate_to_supabase.py` - Migration script (if migration complete)
- `server/reset_supabase.py` - Reset script (if not needed)
- `server/schema.sql` - Old schema (if Supabase migration complete)
- `server/supabase_schema.sql` - Old schema (if Supabase migration complete)
  - **Status**: Review - These might be needed for reference or future migrations

### 7. **Documentation Files** (Review)
- `CLEANUP_ANALYSIS.md` - This cleanup analysis (can delete after review)
- `DARK_MODE_IMPLEMENTATION.md` - Implementation notes (keep for reference)
- `GEMINI_INTEGRATION_SUMMARY.md` - Integration notes (keep for reference)
- `deployment_config.md` - Deployment config (keep if needed)
- `DEPLOYMENT_GUIDE.md` - Deployment guide (KEEP - important)
- `GEMINI_SETUP.md` - Setup guide (KEEP - important)
- `README.md` - Main README (KEEP - important)

## ⚠️ Files to KEEP

### Critical Application Files
- ✅ All Python files listed above
- ✅ `requirements.txt` - Python dependencies
- ✅ `admin_config.json` - Admin configuration
- ✅ `templates/` directory - HTML templates
- ✅ `env.example` - Environment variable template

### Important Documentation
- ✅ `README.md`
- ✅ `DEPLOYMENT_GUIDE.md`
- ✅ `GEMINI_SETUP.md`

## 📊 Summary

### Safe to Delete Now:
1. `fix_password.py` - Utility script
2. `server/database.sqlite` - Local database
3. `tts_output/*.aiff` - Test audio files
4. `audio_files/text_audio.mp3` - Test audio
5. `__pycache__/` - Python cache
6. `export.sql` - Old export (if migration complete)
7. `cleanup_progress_data.sql` - Cleanup script (if migration complete)

### Review Before Deleting:
1. `server/init_database.py` - Check if still needed
2. `server/migrate_to_supabase.py` - Check if migration is complete
3. `server/reset_supabase.py` - Check if needed
4. `server/schema.sql` - Check if needed for reference
5. `server/supabase_schema.sql` - Check if needed for reference
6. `supabase_setup.sql` - Keep if needed for new deployments

### Estimated Space Savings:
- Test audio files: ~1-5MB
- Database file: ~10-50MB
- Cache directories: ~10-50MB
- **Total: ~20-100MB** (much smaller than the 1.7GB BeyondWords directory you already deleted!)

## ✅ Verification: No Broken Dependencies

All imports are working:
- ✅ `python_api.py` → imports `gemini_client`, `gemini_transcription`, `tts_synthesizer_admin_controlled`
- ✅ `tts_synthesizer_admin_controlled.py` → imports `admin_dashboard`, `google_cloud_tts_simple`
- ✅ `admin_dashboard.py` → standalone (no missing imports)
- ✅ All templates referenced in `python_api.py` exist

**Conclusion**: No critical files were deleted. The application should work correctly.

