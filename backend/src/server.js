
import 'dotenv/config';

const PORT = process.env.PORT || 3000;

const server = {
    status: 'ok',
    message: 'Money backend is running'
};

import { createServer } from 'node:http';

const app = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200);
        res.end(JSON.stringify(server));
        return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({
        status: 'error',
        message: 'Route not found'
    }));
});

app.listen(PORT, () => {
    console.log(`Money backend running at http://localhost:${PORT}`);
});
