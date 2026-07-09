# Certificate Verification System - Frontend

A Next.js-based frontend application for blockchain-powered academic certificate verification.

## Features

### University Admin Portal
- Multi-factor authentication (MFA) with TOTP
- Batch certificate issuance via CSV/Excel upload
- Real-time data validation with inline editing
- Blockchain minting integration
- Credential history management

### Student Portal
- Passwordless authentication via OTP
- Certificate dashboard with QR code generation
- PDF download functionality
- Shareable verification links

### Public Verification
- Three-way verification (Database, Hash, Blockchain)
- Standalone verification pages
- QR code scanning support
- Real-time status indication

## Design System

### Color Palette (60-30-10 Architecture)
- **Canvas (60%)**: White (#FFFFFF), Slate Light (#F8FAFC)
- **Structural (30%)**: Deep Slate (#0F172A)
- **Brand**: Deep Navy ramp (primary / CTA / nav — base #1B2A4A)
- **Accent (10%)**: Academic Gold ramp (highlights, verified ring, hover emphasis — base #C9A84C)
- **Semantic status only**:
  - Verified: Emerald Green (#10B981)
  - Pending: Amber (#D97706)
  - Error: Crimson Red (#DC2626)

### Typography
- Font: Inter (Sans-Serif)
- Page Titles: 24px (Bold)
- Section Headers: 18px (Medium)
- Body/Tables: 14px (Regular)

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Notifications**: React Hot Toast
- **QR Codes**: qrcode library
- **File Processing**: xlsx library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
certificate-verification-frontend/
├── app/
│   ├── admin/
│   │   ├── login/          # Admin authentication
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── upload/         # Batch upload interface
│   │   └── history/        # Credential history
│   ├── portal/
│   │   ├── login/          # Student authentication
│   │   └── dashboard/      # Student credentials
│   ├── verify/
│   │   ├── [certificate_id]/ # Public verification
│   │   └── page.tsx        # Certificate ID input
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── lib/
│   ├── api/
│   │   ├── client.ts       # Axios instance
│   │   └── endpoints.ts    # API endpoints
│   ├── constants/
│   │   └── colors.ts       # Design tokens
│   ├── validators.ts       # Input validation
│   └── types.ts            # TypeScript types
└── components/
    ├── SkeletonLoader.tsx  # Loading skeletons
    └── StatusBanner.tsx    # Status indicators
```

## Validation Rules

### National ID
- Exactly 16 numeric digits
- No letters or special characters

### Graduation Year
- 4-digit integer
- Range: 2000 to current year

### Email
- RFC 2822 compliant format
- Standard email pattern validation

### OTP
- Exactly 6 numeric digits

## Accessibility

The application targets **WCAG 2.1 Level AA** compliance:

- **Contrast Ratios**: Minimum 4.5:1 for text, 7:1 for interactive elements
- **Keyboard Navigation**: Full keyboard accessibility with Tab, Shift+Tab, and Enter
- **Screen Readers**: Proper ARIA labels, live regions, and semantic HTML
- **Focus Management**: Visible focus indicators and focus trap in modals

## Performance Optimizations

- **Code Splitting**: Lazy-loaded routes reduce initial bundle size
- **Optimistic UI**: Instant feedback with background synchronization
- **SWR Caching**: 10-minute cache with stale-while-revalidate strategy
- **Image Optimization**: Next.js automatic image optimization

## User Workflows

### Admin Workflow
1. Login with email/password
2. Complete MFA challenge (6-digit TOTP)
3. Upload CSV/Excel file
4. Review and edit data in interactive grid
5. Authorize blockchain minting

### Student Workflow
1. Enter registration number and NID
2. Receive and input OTP
3. View certificate dashboard
4. Download PDF or share verification link

### Recruiter Workflow
1. Scan QR code or click verification link
2. System runs three-way verification
3. View verified profile or error message

## Error Handling

All errors follow an **Actionable and Graceful** pattern:

- Clear, user-friendly error messages
- Recovery instructions provided
- No technical stack traces exposed
- Color-coded severity levels

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## API Integration

The frontend connects to the NestJS backend via REST API:

- **Base URL**: Configured in `NEXT_PUBLIC_API_URL`
- **Authentication**: JWT tokens stored in localStorage
- **Interceptors**: Automatic token attachment and 401 handling

## Contributing

When contributing:
1. Follow the existing design system
2. Maintain accessibility standards
3. Add proper TypeScript types
4. Test on multiple browsers
5. Ensure responsive design

## License

[Your License Here]
