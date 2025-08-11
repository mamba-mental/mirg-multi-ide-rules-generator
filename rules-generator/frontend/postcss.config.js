  export default {
    plugins: {
      "@tailwindcss/postcss": {},
      autoprefixer: {},
    },
  }
  EOFCONFIG
    
    echo "📦 Installing dependencies..."
    npm install
    npm install -D @tailwindcss/postcss
    
    echo "✅ Dependencies installed successfully"
    echo "🔥 Starting Vite dev server with HMR..."
    
    # Start with development optimizations
    npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
  