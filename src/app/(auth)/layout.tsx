export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles auth redirects now
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/images/wtc.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Gradient Overlay - Choose one of the options below */}
      
      {/* Option 1: Gradient from dark to light (top to bottom) */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-violet-900/80 via-violet-600/60 to-sky-400/70"></div> */}
      
      {/* Option 2: Gradient from left to right (uncomment to use) */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-violet-900/90 via-purple-800/70 to-blue-900/90"></div> */}
      
      {/* Option 3: Radial gradient (spotlight effect) */}
      {/* <div className="absolute inset-0 bg-gradient-radial from-transparent via-violet-900/50 to-violet-950/90"></div> */}
      
      {/* Option 4: Subtle gradient with blur (modern glassmorphism) */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-violet-100/50 to-sky-100/60 backdrop-blur-md"></div> */}
      
      {/* Option 5: Dramatic dark gradient */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-violet-900/60 to-black/80"></div> */}
      
      {/* Option 6: Colorful gradient overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/80 via-purple-500/70 to-pink-500/80"></div> */}
      
      {/* Content */}
      <div className="w-full max-w-md px-4 relative z-10">
        {children}
      </div>
    </div>
  );
}
