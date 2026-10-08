# NEXORA

An interactive landing page for NEXORA, a **fictional** revenue operations platform. All names, numbers and customers are sample data, and the page is a concept, not a real product.

The page is a scroll-driven product story rather than a stack of cards:

- **Hero:** a live miniature of the product. Fire an event (seat upgrade, failed payment, new signup) and watch it travel through the dashboard.
- **Disconnected → connected → acting:** five tools merge into one customer record that then acts on its own.
- **Follow one customer:** signup → onboarding → message → conversion → analytics, scrubbed by scroll.
- **Workspace demo:** a working simulated workspace with a "things to try" checklist.
- **Automation:** a trigger → condition → branch → result graph that really evaluates.
- **Compare:** the same question answered by two teams, raced on one clock.
- **Toolkit, reliability, pricing:** live previews, sampled stats and a customer-count slider.

Plain HTML, CSS and ES modules. No build step and no dependencies.

## Run it

ES modules do not load from `file://`, so serve the folder over HTTP:

```sh
npx serve .
# or
python -m http.server 8000
```

Then open the printed address.

## Structure

```
index.html            markup and all styles
js/main.js            entry point; lazy-loads each section
js/core/              scroll engine, motion helpers, lazy loading
js/components/        navigation
js/sections/          one module per scene or section
js/sections/demo/     the simulated workspace
js/ui/                formatting and accessible controls
```

Motion respects `prefers-reduced-motion`, and heavy scenes are simplified on small screens.
