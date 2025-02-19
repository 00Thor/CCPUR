app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],  // Only allow resources from your own domain
        scriptSrc: ["'self'", "trusted-cdn.com"],  // Allow scripts from your domain + trusted CDN
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],  // Allow styles + Google Fonts
        fontSrc: ["'self'", "fonts.gstatic.com"],  // Allow fonts from Google
        imgSrc: ["'self'", "data:", "your-image-cdn.com"],  // Allow images from your domain and CDN
        connectSrc: ["'self'", "api.your-college.com"],  // Allow API requests only to your backend
        frameSrc: ["'self'", "www.youtube.com"],  // Allow embedding only from YouTube
        objectSrc: ["'none'"],  // Block <object>, <embed>, <applet>
        upgradeInsecureRequests: [],  // Automatically upgrade HTTP to HTTPS
      },
    })
  );
  