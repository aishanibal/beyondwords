# Dark Mode Implementation

This document describes the global dark mode implementation for the BeyondWords application.

## Overview

The dark mode system provides users with three theme options:
- **Light**: Always use light theme
- **Dark**: Always use dark theme  
- **Auto**: Follow system preference

## Architecture

### 1. Context Provider (`DarkModeContext.tsx`)
- Manages global theme state
- Handles theme persistence in localStorage
- Syncs with system preference changes
- Provides theme switching functionality

### 2. Database Integration
- User preferences stored in `users.preferences` JSON field
- Theme preference persists across sessions
- Backend API supports updating user preferences

### 3. CSS Variables
- Light and dark theme colors defined as CSS custom properties
- Smooth transitions between themes
- Tailwind CSS classes for dark mode variants

## Key Components

### DarkModeProvider
```tsx
const { isDarkMode, theme, setTheme, syncWithUserPreferences } = useDarkMode();
```

### ThemeToggle Component
- Dropdown selector for theme options
- Can be used anywhere in the app
- Automatically styled for current theme

### Navigation Integration
- Theme toggle available in main navigation
- Profile dropdown styled for dark mode
- Smooth transitions on theme change

## Database Schema

```sql
ALTER TABLE users ADD COLUMN preferences TEXT;
```

User preferences are stored as JSON:
```json
{
  "theme": "light|dark|auto",
  "notifications_enabled": true,
  "email_notifications": true,
  "language": "en"
}
```

## API Endpoints

### Update User Preferences
```
PUT /api/user/profile
{
  "first_name": "John",
  "last_name": "Doe", 
  "preferences": {
    "theme": "dark",
    "notifications_enabled": true,
    "email_notifications": true,
    "language": "en"
  }
}
```

## CSS Variables

### Light Theme
```css
:root {
  --background: #f9f6f4;
  --foreground: hsl(0, 0%, 24%);
  --card: #ffffff;
  --card-foreground: hsl(0, 0%, 24%);
  /* ... more variables */
}
```

### Dark Theme
```css
.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f8fafc;
  /* ... more variables */
}
```

## Usage Examples

### Basic Theme Detection
```tsx
const { isDarkMode } = useDarkMode();

return (
  <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
    Content
  </div>
);
```

### Theme Toggle Component
```tsx
import ThemeToggle from './components/ThemeToggle';

<ThemeToggle showLabel={true} />
```

### Conditional Styling
```tsx
const { isDarkMode } = useDarkMode();

<button className={`px-4 py-2 rounded-lg ${
  isDarkMode 
    ? 'bg-gray-700 text-white hover:bg-gray-600' 
    : 'bg-white text-gray-900 hover:bg-gray-50'
}`}>
  Button
</button>
```

## Migration

For existing databases, run the migration script:
```sql
-- Add preferences column to existing users table
ALTER TABLE users ADD COLUMN preferences TEXT;

-- Update existing users with default preferences
UPDATE users SET preferences = '{"theme": "light", "notifications_enabled": true, "email_notifications": true, "language": "en"}' WHERE preferences IS NULL;
```

## Testing

Visit `/test-dark-mode` to test the dark mode functionality:
- Theme switching
- Smooth transitions
- Form elements
- Component styling

## Best Practices

1. **Always use CSS variables** for colors instead of hardcoded values
2. **Test both themes** when developing new components
3. **Use conditional classes** based on `isDarkMode` state
4. **Include transitions** for smooth theme switching
5. **Follow the established color palette** for consistency

## Troubleshooting

### Theme not persisting
- Check localStorage for theme preference
- Verify user preferences are being saved to database
- Ensure `syncWithUserPreferences` is called on login

### Styling issues
- Verify CSS variables are properly defined
- Check Tailwind dark mode classes are applied
- Ensure transitions are included for smooth switching

### Performance
- Theme switching is optimized with CSS transitions
- Context updates are minimal and efficient
- No unnecessary re-renders during theme changes 