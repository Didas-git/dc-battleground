Bun.serve({
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"))
            return new Response(Bun.file(`${import.meta.dir}/index.html`));
        else if (url.pathname.endsWith("/level.js"))
            return new Response(Bun.file(`${import.meta.dir}/level.js`));
        return new Response("Hello!");
    }
});
