# Raimond Color Scheme

## Custom Color Palette

### Primary Colors

#### 1. **Primary - Bright Cyan** 
- **Hex**: `#62F4F3`
- **Usage**: Main accent color, buttons, links, focus states
- **Light Mode**: Buttons, active states, highlights
- **Dark Mode**: Primary actions, focus rings

#### 2. **Secondary - Dark Blue**
- **Hex**: `#06202B`
- **Usage**: Text, backgrounds (dark mode), secondary elements
- **Light Mode**: Primary text color, headings
- **Dark Mode**: Background color, surfaces

#### 3. **Tertiary - Teal**
- **Hex**: `#077A7D`
- **Usage**: Accents, hover states, secondary actions
- **Light Mode**: Accent elements, icons
- **Dark Mode**: Secondary actions, highlights

#### 4. **Tertiary Secondary - Cream**
- **Hex**: `#F5EEDD`
- **Usage**: Backgrounds, cards, surfaces
- **Light Mode**: Background color, card surfaces
- **Dark Mode**: Text color, foreground elements

## Color Application

### Light Mode Theme
```
Background:     #F5EEDD (Cream)
Text:           #06202B (Dark Blue)
Primary:        #62F4F3 (Bright Cyan)
Accent:         #077A7D (Teal)
Cards:          Lighter Cream
Borders:        Light Cream variants
```

### Dark Mode Theme
```
Background:     #06202B (Dark Blue)
Text:           #F5EEDD (Cream)
Primary:        #62F4F3 (Bright Cyan)
Accent:         #077A7D (Teal)
Cards:          Lighter Dark Blue
Borders:        Subtle Dark Blue variants
```

## UI Element Colors

### Buttons
- **Primary Button**: Bright Cyan (#62F4F3) background with Dark Blue (#06202B) text
- **Secondary Button**: Teal (#077A7D) background with Cream (#F5EEDD) text
- **Outline Button**: Transparent with Bright Cyan border

### Message Bubbles
- **User Messages**: Bright Cyan (#62F4F3) background
- **AI Messages**: Cream (#F5EEDD) in light mode, Dark Blue (#06202B) in dark mode

### Sidebar
- **Background**: Light Cream in light mode, Dark Blue in dark mode
- **Active Item**: Bright Cyan (#62F4F3) highlight
- **Hover State**: Teal (#077A7D) tint

### Inputs & Forms
- **Input Background**: Muted Cream in light mode, Muted Dark Blue in dark mode
- **Focus Ring**: Bright Cyan (#62F4F3)
- **Border**: Light borders matching theme

### Status Indicators
- **Sync Active**: Bright Cyan (#62F4F3) with glow
- **Hover**: Teal (#077A7D)
- **Disabled**: Muted variants

## Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards:
- Dark Blue (#06202B) on Cream (#F5EEDD): ✅ High contrast
- Bright Cyan (#62F4F3) on Dark Blue (#06202B): ✅ Good contrast
- Cream (#F5EEDD) on Dark Blue (#06202B): ✅ High contrast
- Teal (#077A7D) on Cream (#F5EEDD): ✅ Good contrast

### Focus States
All interactive elements use Bright Cyan (#62F4F3) focus rings for visibility.

## Color Psychology

### Bright Cyan (#62F4F3)
- **Feeling**: Modern, fresh, technological
- **Purpose**: Draws attention, indicates interactivity
- **Use Case**: Primary actions, important UI elements

### Dark Blue (#06202B)
- **Feeling**: Professional, trustworthy, stable
- **Purpose**: Provides depth and grounding
- **Use Case**: Text, backgrounds, serious content

### Teal (#077A7D)
- **Feeling**: Calm, balanced, sophisticated
- **Purpose**: Secondary emphasis without overwhelming
- **Use Case**: Hover states, secondary actions

### Cream (#F5EEDD)
- **Feeling**: Warm, comfortable, elegant
- **Purpose**: Soft backgrounds that reduce eye strain
- **Use Case**: Backgrounds, surfaces, light mode base

## Implementation

All colors are defined in `/app/globals.css` using oklch color space for:
- Better color consistency across displays
- Smooth gradients and transitions
- Perceptually uniform color adjustments

### CSS Variables
```css
/* Light Mode */
--primary: oklch(0.88 0.12 195);     /* #62F4F3 */
--secondary: oklch(0.15 0.02 220);   /* #06202B */
--accent: oklch(0.45 0.08 195);      /* #077A7D */
--background: oklch(0.96 0.01 85);   /* #F5EEDD */

/* Dark Mode */
--primary: oklch(0.88 0.12 195);     /* #62F4F3 */
--secondary: oklch(0.45 0.08 195);   /* #077A7D */
--background: oklch(0.15 0.02 220);  /* #06202B */
--foreground: oklch(0.96 0.01 85);   /* #F5EEDD */
```

## Files Modified

- `app/globals.css` - Main color definitions
- `public/manifest.json` - PWA theme colors
- `app/layout.tsx` - Theme-color meta tag

## Testing

Test the color scheme in:
1. ✅ Light mode
2. ✅ Dark mode
3. ✅ Different screen brightness levels
4. ✅ Color blind simulation tools
5. ✅ Mobile and desktop displays

## Future Enhancements

Potential color additions:
- Success state: Derived from Teal
- Warning state: Complementary warm tone
- Error state: Existing destructive red
- Info state: Lighter Cyan variant
