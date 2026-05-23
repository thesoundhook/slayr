# Slayr - Premium Event Ticketing Platform

A modern, responsive event ticketing platform built with React, TypeScript, and Tailwind CSS.

## Features

✨ **Core Features**
- Event discovery and browsing
- Advanced filtering and search
- Detailed event pages with ticket selection
- Shopping cart functionality
- Secure checkout flow
- Responsive design with modern UI

🎨 **Design**
- Premium dark theme with gradient accents
- Smooth animations with Framer Motion
- Glass morphism effects
- Professional typography (Space Grotesk + Inter)
- Mobile-first responsive design

⚡ **Tech Stack**
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-ticketing-platform
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Card, etc.)
│   └── layout/         # Layout components (Navbar, Footer)
├── pages/              # Page components
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
├── data/               # Mock data and constants
└── assets/             # Static assets
```

## Key Components

### Pages
- **HomePage**: Landing page with featured events and hero section
- **EventsPage**: Event listing with search and filtering
- **EventDetailPage**: Detailed event view with ticket selection
- **CartPage**: Shopping cart with item management
- **CheckoutPage**: Secure checkout form

### State Management
- **cartStore**: Manages shopping cart state with persistence
- Uses Zustand for lightweight state management

### UI Components
- Custom components built on Radix UI primitives
- Consistent design system with Tailwind CSS
- Smooth animations with Framer Motion

## Features in Detail

### Event Discovery
- Browse events by category (Music, Sports, Comedy, etc.)
- Search by title, description, venue, or city
- Filter by date range and price
- Featured events highlighting

### Ticket Management
- Multiple ticket types per event (General, VIP, Early Bird)
- Real-time availability tracking
- Quantity limits and validation
- Dynamic pricing display

### Shopping Cart
- Persistent cart storage
- Real-time price calculations
- Service fee calculations
- Item quantity management

### Checkout Flow
- Secure payment form
- Order summary
- Billing information
- Payment processing simulation

## Mock Data

The application uses comprehensive mock data including:
- 6 sample events across different categories
- Realistic venue information
- Multiple ticket types per event
- Pricing and availability data

## Customization

### Theming
The application uses CSS custom properties for theming. You can customize colors in:
- `src/index.css` - CSS custom properties
- `tailwind.config.js` - Tailwind theme configuration

### Adding New Events
Mock events can be modified in `src/data/mockEvents.ts`

## Future Enhancements

- User authentication and profiles
- Real payment processing integration
- Event organizer dashboard
- Seat selection for venues
- Email ticket delivery
- Mobile app development
- Social features and reviews

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request