import express from 'express';
import cors from 'cors';
import authRoutes from './src/modules/auth/auth.routes.js';
import systemRoutes from './src/modules/system/system.routes.js';
import uploadRoutes from './src/modules/upload/upload.routes.js';
import qaRoutes from './src/modules/qa/qa.routes.js';
import recordsRoutes from './src/modules/records/records.routes.js';
import {
    TEMP_DOCS_DIR,
    ensureRuntimeDirectories,
} from './src/shared/runtime/files.js';

const app = express();

ensureRuntimeDirectories();

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.use('/api/documents', express.static(TEMP_DOCS_DIR));

app.use(authRoutes);
app.use(systemRoutes);
app.use(uploadRoutes);
app.use(qaRoutes);
app.use(recordsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Express corriendo en http://0.0.0.0:${PORT} (accesible externamente)`);
});
